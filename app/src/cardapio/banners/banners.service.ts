import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.scoped.banner.findMany({
      where: { tenantId },
      orderBy: { ordem: 'asc' },
    });
  }

  async create(tenantId: string, dto: { imagemUrl: string; titulo?: string; linkUrl?: string }) {
    const maxOrdem = await this.prisma.scoped.banner.aggregate({
      where: { tenantId },
      _max: { ordem: true },
    });
    return this.prisma.scoped.banner.create({
      data: { tenantId, ...dto, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  update(id: string, dto: { imagemUrl?: string; titulo?: string; linkUrl?: string; ativo?: boolean }) {
    return this.prisma.scoped.banner.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.scoped.banner.delete({ where: { id } });
  }
}
