import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.scoped.categoriaCardapio.findMany({
      where: { tenantId },
      orderBy: { ordem: 'asc' },
    });
  }

  async create(tenantId: string, dto: { nome: string }) {
    const maxOrdem = await this.prisma.scoped.categoriaCardapio.aggregate({
      _max: { ordem: true },
    });
    return this.prisma.scoped.categoriaCardapio.create({
      data: { tenantId, nome: dto.nome, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  async update(id: string, dto: { nome?: string }) {
    return this.prisma.scoped.categoriaCardapio.update({ where: { id }, data: dto });
  }

  async reorder(_tenantId: string, ordem: string[]) {
    await Promise.all(
      ordem.map((id, index) =>
        this.prisma.scoped.categoriaCardapio.update({ where: { id }, data: { ordem: index } }),
      ),
    );
  }

  async remove(id: string) {
    const count = await this.prisma.scoped.produto.count({ where: { categoriaId: id } });
    if (count > 0) throw new BadRequestException('Exclua os produtos desta categoria primeiro');
    await this.prisma.scoped.categoriaCardapio.deleteMany({ where: { id } });
  }
}
