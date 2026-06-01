import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { verifyPassword, generateRefreshToken, hashToken, isLocked } from '../shared/auth-utils';
import { AuditService } from '../../infra/audit/audit.service';

const AUD_MAP: Record<string, string> = {
  PLATFORM_ADMIN: 'platform',
  TENANT_USER: 'tenant-user',
  CUSTOMER: 'customer',
};

@Injectable()
export class PlatformAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private audit: AuditService,
  ) {}

  async login(email: string, password: string, ip: string, userAgent?: string) {
    const admin = await this.prisma.platform().platformAdmin.findUnique({ where: { email } });
    if (!admin) {
      await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (isLocked(admin.lockedUntil)) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    const valid = await verifyPassword(admin.passwordHash, password);
    if (!valid) {
      await this.incrementFailedAttempts(admin.id);
      await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.platform().platformAdmin.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, true);
    await this.audit.log({ actorType: 'PLATFORM_ADMIN', actorId: admin.id, action: 'login', ip });

    return this.createSession(admin.id, 'PLATFORM_ADMIN', ip, userAgent);
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.platform().refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.platform().refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(stored.userId, stored.userType as any, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.platform().refreshToken.updateMany({
      where: { userId, userType: 'PLATFORM_ADMIN', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(adminId: string) {
    return this.prisma.platform().platformAdmin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, totpEnabled: true, createdAt: true },
    });
  }

  private async createSession(userId: string, userType: string, ip: string, userAgent?: string) {
    const accessToken = this.tokenService.createAccessToken({
      sub: userId, aud: (AUD_MAP[userType] || 'platform') as 'platform',
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.prisma.platform().refreshToken.create({
      data: {
        userType: userType as any,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  private async incrementFailedAttempts(adminId: string) {
    const admin = await this.prisma.platform().platformAdmin.findUnique({ where: { id: adminId } });
    const count = admin!.failedLoginCount + 1;
    const data: any = { failedLoginCount: count };
    if (count >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await this.prisma.platform().platformAdmin.update({ where: { id: adminId }, data });
  }

  private async recordAttempt(userType: string, identifier: string, tenantId: string | null, ip: string, userAgent: string | undefined, success: boolean) {
    await this.prisma.platform().loginAttempt.create({
      data: { userType: userType as any, identifier, tenantId, ip, userAgent, success },
    });
  }
}
