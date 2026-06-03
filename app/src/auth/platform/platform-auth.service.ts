import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { TotpService } from '../shared/totp.service';
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
    private totp: TotpService,
    private audit: AuditService,
  ) {}

  async login(email: string, password: string, ip: string, userAgent?: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { email } });
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

    await this.prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.recordAttempt('PLATFORM_ADMIN', email, null, ip, userAgent, true);
    await this.audit.log({ actorType: 'PLATFORM_ADMIN', actorId: admin.id, action: 'login', ip });

    if (admin.totpEnabled) {
      const preAuthToken = this.totp.createPreAuthToken(admin.id);
      return { type: 'totp_required' as const, preAuthToken };
    }

    return this.createSession(admin.id, 'PLATFORM_ADMIN', ip, userAgent);
  }

  async verifyTotpLogin(preAuthToken: string, code: string, ip: string, userAgent?: string) {
    const { userId } = this.totp.consumePreAuthToken(preAuthToken);
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: userId } });
    if (!admin || !admin.totpSecret) throw new BadRequestException('TOTP não configurado');
    if (!await this.totp.verify(code, admin.totpSecret)) throw new BadRequestException('Código inválido');
    return this.createSession(admin.id, 'PLATFORM_ADMIN', ip, userAgent);
  }

  async setupTotp(adminId: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: adminId } });
    if (!admin) throw new BadRequestException('Admin não encontrado');
    const { secret, url } = this.totp.generateSecret(admin.email);
    await this.prisma.platformAdmin.update({
      where: { id: adminId },
      data: { totpSecret: secret, totpEnabled: false },
    });
    return { secret, url };
  }

  async enableTotp(adminId: string, code: string) {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: adminId } });
    if (!admin || !admin.totpSecret) throw new BadRequestException('TOTP não configurado');
    if (!await this.totp.verify(code, admin.totpSecret)) throw new BadRequestException('Código inválido');
    await this.prisma.platformAdmin.update({
      where: { id: adminId },
      data: { totpEnabled: true },
    });
    return { message: '2FA ativado com sucesso' };
  }

  async disableTotp(adminId: string) {
    await this.prisma.platformAdmin.update({
      where: { id: adminId },
      data: { totpEnabled: false, totpSecret: null },
    });
    return { message: '2FA desativado' };
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(stored.userId, stored.userType as any, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, userType: 'PLATFORM_ADMIN', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(adminId: string) {
    return this.prisma.platformAdmin.findUnique({
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

    await this.prisma.refreshToken.create({
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
    const admin = await this.prisma.platformAdmin.findUnique({ where: { id: adminId } });
    const count = admin!.failedLoginCount + 1;
    const data: any = { failedLoginCount: count };
    if (count >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await this.prisma.platformAdmin.update({ where: { id: adminId }, data });
  }

  private async recordAttempt(userType: string, identifier: string, tenantId: string | null, ip: string, userAgent: string | undefined, success: boolean) {
    await this.prisma.loginAttempt.create({
      data: { userType: userType as any, identifier, tenantId, ip, userAgent, success },
    });
  }
}
