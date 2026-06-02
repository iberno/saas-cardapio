import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async getTheme(tenantId: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({
      where: { id: tenantId },
      select: { theme: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.theme || {};
  }

  async updateTheme(tenantId: string, theme: Record<string, string>) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.platform().tenant.update({
      where: { id: tenantId },
      data: { theme },
      select: { theme: true },
    });
  }
}
