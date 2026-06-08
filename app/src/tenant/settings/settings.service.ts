import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, settings: true, name: true, contactPhone: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const s = (tenant.settings || {}) as Record<string, unknown>;
    return {
      slug: tenant.slug,
      name: tenant.name,
      contactPhone: tenant.contactPhone,
      description: s.description || '',
      address: s.address || '',
      instagram: s.instagram || '',
      hoursText: s.hoursText || '',
      paymentMethods: s.paymentMethods || '',
      pointsEnabled: s.pointsEnabled || false,
      pointsPerReais: s.pointsPerReais || 1,
      logoUrl: s.logoUrl || '',
    };
  }

  async updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const { contactPhone, slug, ...settingsDto } = dto;
    const current = (tenant.settings || {}) as Record<string, unknown>;
    const updated = { ...current, ...settingsDto };

    if (slug && slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({ where: { slug } });
      if (existing) throw new ConflictException('Slug já está em uso');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        slug: slug ?? undefined,
        settings: updated,
        ...(contactPhone !== undefined ? { contactPhone } : {}),
      },
    });

    const final = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });

    return {
      slug: final!.slug,
      ...updated,
      name: tenant.name,
      contactPhone: contactPhone !== undefined ? contactPhone : tenant.contactPhone,
    };
  }
}
