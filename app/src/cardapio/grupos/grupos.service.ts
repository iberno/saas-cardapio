import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class GruposService {
  constructor(private prisma: PrismaService) {}

  findAll(produtoId: string) {
    return this.prisma.platform().grupo.findMany({
      where: { produtoId },
      orderBy: { ordem: 'asc' },
      include: { itens: { orderBy: { nome: 'asc' } } },
    });
  }

  async create(produtoId: string, dto: { nome: string; maxSelect?: number }) {
    const maxOrdem = await this.prisma.platform().grupo.aggregate({
      where: { produtoId },
      _max: { ordem: true },
    });
    return this.prisma.platform().grupo.create({
      data: { produtoId, nome: dto.nome, maxSelect: dto.maxSelect ?? 1, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
    });
  }

  update(id: string, dto: { nome?: string; maxSelect?: number }) {
    return this.prisma.platform().grupo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.platform().grupoItem.deleteMany({ where: { grupoId: id } });
    await this.prisma.platform().grupo.delete({ where: { id } });
  }

  criarItem(grupoId: string, dto: { nome: string; preco?: number }) {
    return this.prisma.platform().grupoItem.create({
      data: { grupoId, nome: dto.nome, preco: dto.preco ?? 0 },
    });
  }

  atualizarItem(id: string, dto: { nome?: string; preco?: number }) {
    return this.prisma.platform().grupoItem.update({ where: { id }, data: dto });
  }

  removerItem(id: string) {
    return this.prisma.platform().grupoItem.delete({ where: { id } });
  }
}
