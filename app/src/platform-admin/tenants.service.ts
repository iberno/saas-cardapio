import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatus } from '@prisma/client';
import { hashPassword } from '../auth/shared/auth-utils';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const { ownerEmail, ownerPassword, ...tenantData } = dto;
    const tenant = await this.prisma.platform().tenant.create({ data: tenantData });

    if (ownerEmail && ownerPassword) {
      const passwordHash = await hashPassword(ownerPassword);
      await this.prisma.platform().tenantUser.create({
        data: {
          tenantId: tenant.id,
          email: ownerEmail,
          passwordHash,
          name: 'Proprietário',
          role: 'OWNER',
        },
      });
    }

    return {
      ...tenant,
      ownerEmail: ownerEmail || undefined,
    };
  }

  async findAll() {
    return this.prisma.platform().tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, name: true, status: true, contactEmail: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.platform().tenant.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.platform().tenant.delete({ where: { id } });
  }

  async updateStatus(id: string, status: TenantStatus) {
    await this.findOne(id);
    return this.prisma.platform().tenant.update({
      where: { id },
      data: { status },
    });
  }

  async getStats() {
    const [totalTenants, activeTenants, totalProdutos] = await Promise.all([
      this.prisma.platform().tenant.count(),
      this.prisma.platform().tenant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.platform().produto.count(),
    ]);
    return { totalTenants, activeTenants, totalProdutos };
  }
}
