import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    return this.prisma.platform().tenant.create({ data: dto });
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

  async updateStatus(id: string, status: TenantStatus) {
    const tenant = await this.findOne(id);
    return this.prisma.platform().tenant.update({
      where: { id },
      data: { status },
    });
  }
}
