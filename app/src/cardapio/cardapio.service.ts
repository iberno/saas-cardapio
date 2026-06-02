import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Categoria, Prisma } from '@prisma/client';

@Injectable()
export class CardapioService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    params: {
      page?: number;
      limit?: number;
      categoria?: Categoria;
      ordenacao?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.ProdutoOrderByWithRelationInput = {};
    if (params.ordenacao === 'nome') orderBy.nome = 'asc';
    else if (params.ordenacao === 'preco') orderBy.preco = 'asc';
    else if (params.ordenacao === 'categoria') orderBy.categoria = 'asc';
    else orderBy.createdAt = 'desc';

    const where: Prisma.ProdutoWhereInput = { tenantId };
    if (params.categoria) where.categoria = params.categoria;

    const [data, total] = await Promise.all([
      this.prisma.platform().produto.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.platform().produto.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const produto = await this.prisma.platform().produto.findFirst({
      where: { id, tenantId },
    });
    if (!produto) throw new NotFoundException('Produto not found');
    return produto;
  }

  create(tenantId: string, dto: CreateProdutoDto) {
    return this.prisma.platform().produto.create({
      data: { ...dto, tenantId, preco: new Prisma.Decimal(dto.preco) },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProdutoDto) {
    await this.findOne(tenantId, id);
    const data: any = { ...dto };
    if (dto.preco !== undefined) data.preco = new Prisma.Decimal(dto.preco);
    return this.prisma.platform().produto.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.platform().produto.delete({ where: { id } });
  }
}
