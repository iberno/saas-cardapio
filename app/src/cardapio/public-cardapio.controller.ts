import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

@Controller('public')
export class PublicCardapioController {
  constructor(private prisma: PrismaService) {}

  @Get(':slug/produtos')
  async getProdutos(@Param('slug') slug: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    const data = await this.prisma.platform().produto.findMany({
      where: { tenantId: tenant.id, disponivel: true },
      include: {
        categoriaCardapio: { select: { id: true, nome: true } },
        variantes: { orderBy: { preco: 'asc' } },
        grupos: {
          orderBy: { ordem: 'asc' },
          include: { itens: { orderBy: { nome: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length, page: 1, limit: 50, totalPages: 1 };
  }

  @Get(':slug/loja')
  async getLoja(@Param('slug') slug: string) {
    return this.prisma.platform().tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, theme: true, contactPhone: true },
    });
  }

  @Get(':slug/banners')
  async getBanners(@Param('slug') slug: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return [];
    return this.prisma.platform().banner.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }
}
