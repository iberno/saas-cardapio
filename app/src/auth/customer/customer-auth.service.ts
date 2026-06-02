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

  async me(customerId: string, tenantId: string) {
    return this.prisma.customer.findUnique({
      where: { id: customerId, tenantId },
      select: { id: true, phone: true, name: true, points: true, createdAt: true },
    });
  }
}
