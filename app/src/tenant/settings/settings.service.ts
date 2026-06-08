import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true, name: true, contactPhone: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const s = (tenant.settings || {}) as Record<string, unknown>;
    return {
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

    const { contactPhone, ...settingsDto } = dto;
    const current = (tenant.settings || {}) as Record<string, unknown>;
    const updated = { ...current, ...settingsDto };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updated,
        ...(contactPhone !== undefined ? { contactPhone } : {}),
      },
    });

    return {
      ...updated,
      name: tenant.name,
      contactPhone: contactPhone !== undefined ? contactPhone : tenant.contactPhone,
    };
  }
}
