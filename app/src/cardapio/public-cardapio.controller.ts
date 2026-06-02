import { Controller, Get, Param } from '@nestjs/common';
import { CardapioService } from './cardapio.service';
import { PrismaService } from '../infra/prisma/prisma.service';

@Controller('public')
export class PublicCardapioController {
  constructor(
    private cardapio: CardapioService,
    private prisma: PrismaService,
  ) {}

  @Get(':slug/produtos')
  async getProdutos(@Param('slug') slug: string) {
    const tenant = await this.prisma.platform().tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    return this.cardapio.findAll(tenant.id, {});
  }

  @Get(':slug/loja')
  async getLoja(@Param('slug') slug: string) {
    return this.prisma.platform().tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, theme: true, contactPhone: true },
    });
  }
}
