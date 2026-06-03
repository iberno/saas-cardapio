import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { TotpService } from '../shared/totp.service';
import { verifyPassword, generateRefreshToken, hashToken, isLocked } from '../shared/auth-utils';
import { AuditService } from '../../infra/audit/audit.service';
import { TenantContext } from '../../tenant/tenant-context';

const AUD_MAP: Record<string, string> = {
  PLATFORM_ADMIN: 'platform',
  TENANT_USER: 'tenant-user',
  CUSTOMER: 'customer',
};

@Injectable()
export class TenantUserAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private totp: TotpService,
    private audit: AuditService,
  ) {}

  async login(email: string, password: string, ip: string, userAgent?: string, slug?: string) {
    let tenantId: string;
    if (slug) {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
      if (!tenant) throw new UnauthorizedException('Invalid credentials');
      tenantId = tenant.id;
    } else {
      tenantId = TenantContext.require().tenantId;
    }

    const user = await this.prisma.tenantUser.findFirst({
      where: { tenantId, email },
    });

    if (!user) {
      await this.recordAttempt('TENANT_USER', email, tenantId, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (isLocked(user.lockedUntil)) {
      throw new UnauthorizedException('Account locked');
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      await this.incrementFailedAttempts(user.id);
      await this.recordAttempt('TENANT_USER', email, tenantId, ip, userAgent, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.tenantUser.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.audit.log({
      tenantId,
      actorType: 'TENANT_USER',
      actorId: user.id,
      action: 'login',
      ip,
    });

    if (user.totpEnabled) {
      const preAuthToken = this.totp.createPreAuthToken(user.id, tenantId);
      return { type: 'totp_required' as const, preAuthToken };
    }

    return this.createSession(user, tenantId, ip, userAgent);
  }

  async verifyTotpLogin(preAuthToken: string, code: string, ip: string, userAgent?: string) {
    const { userId, tenantId } = this.totp.consumePreAuthToken(preAuthToken);
    const user = await this.prisma.tenantUser.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException('TOTP não configurado');
    if (!await this.totp.verify(code, user.totpSecret)) throw new BadRequestException('Código inválido');
    return this.createSession(user, tenantId!, ip, userAgent);
  }

  async setupTotp(userId: string) {
    const user = await this.prisma.tenantUser.findUnique({ where: { id: userId }, include: { tenant: { select: { name: true } } } });
    if (!user) throw new BadRequestException('Usuário não encontrado');
    const { secret, url } = this.totp.generateSecret(user.email, user.tenant?.name || 'SaaS Cardápio');
    await this.prisma.tenantUser.update({
      where: { id: userId },
      data: { totpSecret: secret, totpEnabled: false },
    });
    return { secret, url };
  }

  async enableTotp(userId: string, code: string) {
    const user = await this.prisma.tenantUser.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException('TOTP não configurado');
    if (!await this.totp.verify(code, user.totpSecret)) throw new BadRequestException('Código inválido');
    await this.prisma.tenantUser.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return { message: '2FA ativado com sucesso' };
  }

  async disableTotp(userId: string) {
    await this.prisma.tenantUser.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null },
    });
    return { message: '2FA desativado' };
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.scoped.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.scoped.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.createSessionFromToken(stored, ip, userAgent);
  }

  async logout(userId: string) {
    await this.prisma.scoped.refreshToken.updateMany({
      where: { userId, userType: 'TENANT_USER', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string, tenantId: string) {
    const user = await this.prisma.tenantUser.findUnique({
      where: { id: userId, tenantId },
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, tenantId: true, tenant: { select: { slug: true } }, createdAt: true },
    });
    if (!user) return null
    const { tenant, ...rest } = user
    return { ...rest, slug: tenant.slug }
  }

  private async createSession(user: any, tenantId: string, ip: string, userAgent?: string) {
    const accessToken = this.tokenService.createAccessToken({
      sub: user.id,
      aud: AUD_MAP['TENANT_USER'] as 'tenant-user',
      tenantId,
      roles: [user.role],
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.prisma.scoped.refreshToken.create({
      data: {
        userType: 'TENANT_USER',
        userId: user.id,
        tenantId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  private async createSessionFromToken(stored: any, ip: string, userAgent?: string) {
    const user = await this.prisma.tenantUser.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.createSession(user, stored.tenantId!, ip, userAgent);
  }

  private async incrementFailedAttempts(userId: string) {
    const user = await this.prisma.tenantUser.findUnique({ where: { id: userId } });
    if (!user) return;
    const count = user.failedLoginCount + 1;
    const data: any = { failedLoginCount: count };
    if (count >= 5) {
      data.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
    await this.prisma.tenantUser.update({ where: { id: userId }, data });
  }

  private async recordAttempt(userType: string, identifier: string, tenantId: string | null, ip: string, userAgent: string | undefined, success: boolean) {
    await this.prisma.loginAttempt.create({
      data: { userType: userType as any, identifier, tenantId, ip, userAgent, success },
    });
  }
}
