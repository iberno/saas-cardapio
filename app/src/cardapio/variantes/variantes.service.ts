import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VariantesService {
  constructor(private prisma: PrismaService) {}

  findAll(produtoId: string) {
    return this.prisma.platform().produtoVariante.findMany({
      where: { produtoId },
      orderBy: { preco: 'asc' },
    });
  }

  async create(produtoId: string, dto: { nome: string; preco: number }) {
    const variante = await this.prisma.platform().produtoVariante.create({
      data: { produtoId, nome: dto.nome, preco: new Prisma.Decimal(dto.preco) },
    });
    await this.atualizarPrecoProduto(produtoId);
    return variante;
  }

  async update(id: string, dto: { nome?: string; preco?: number }) {
    const data: any = { ...dto };
    if (dto.preco !== undefined) data.preco = new Prisma.Decimal(dto.preco);
    const variante = await this.prisma.platform().produtoVariante.update({ where: { id }, data });
    await this.atualizarPrecoProduto(variante.produtoId);
    return variante;
  }

  async remove(id: string) {
    const v = await this.prisma.platform().produtoVariante.findUnique({ where: { id } });
    if (!v) return;
    await this.prisma.platform().produtoVariante.delete({ where: { id } });
    await this.atualizarPrecoProduto(v.produtoId);
  }

  private async atualizarPrecoProduto(produtoId: string) {
    const min = await this.prisma.platform().produtoVariante.aggregate({
      where: { produtoId },
      _min: { preco: true },
    });
    await this.prisma.platform().produto.update({
      where: { id: produtoId },
      data: { preco: min._min.preco ?? 0 },
    });
  }
}
