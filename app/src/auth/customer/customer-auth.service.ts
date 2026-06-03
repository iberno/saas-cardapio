import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TokenService } from '../shared/token.service';
import { generateRefreshToken, hashToken } from '../shared/auth-utils';
import { TenantContext } from '../../tenant/tenant-context';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
  ) {}

  async login(phone: string, ip: string, userAgent?: string) {
    const tenant = TenantContext.require();

    const customer = await this.prisma.scoped.customer.upsert({
      where: { tenantId_phone: { tenantId: tenant.tenantId, phone } },
      update: {},
      create: { tenantId: tenant.tenantId, phone },
    });

    const accessToken = this.tokenService.createAccessToken({
      sub: customer.id, aud: 'customer', tenantId: tenant.tenantId,
    });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await this.prisma.scoped.refreshToken.create({
      data: {
        userType: 'CUSTOMER', userId: customer.id, tenantId: tenant.tenantId,
        tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip, userAgent,
      },
    });

    return { accessToken, refreshToken, customer };
  }

  async refresh(refreshToken: string, ip: string, userAgent?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (stored.userType !== 'CUSTOMER') {
      throw new UnauthorizedException('Invalid token type');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.tokenService.createAccessToken({
      sub: stored.userId, aud: 'customer', tenantId: stored.tenantId ?? undefined,
    });
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userType: 'CUSTOMER',
        userId: stored.userId,
        tenantId: stored.tenantId,
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdIp: ip,
        userAgent,
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async me(customerId: string, tenantId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId, tenantId },
      select: { id: true, phone: true, name: true, points: true, createdAt: true, address: true },
    });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, theme: true, contactPhone: true },
    });
    return { ...customer, tenant };
  }

  async update(customerId: string, tenantId: string, data: { name?: string; address?: string }) {
    return this.prisma.customer.update({
      where: { id: customerId, tenantId },
      data,
      select: { id: true, phone: true, name: true, points: true, createdAt: true, address: true },
    });
  }
}
