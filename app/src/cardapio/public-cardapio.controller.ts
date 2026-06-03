import { Controller, Get, Post, Param, Body, Req, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { Request } from 'express';

@Controller('public')
export class PublicCardapioController {
  constructor(private prisma: PrismaService) {}

  @Get(':slug/produtos')
  async getProdutos(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    const data = await this.prisma.produto.findMany({
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
    return this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, theme: true, contactPhone: true, settings: true },
    });
  }

  @Get(':slug/banners')
  async getBanners(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return [];
    return this.prisma.banner.findMany({
      where: { tenantId: tenant.id, ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }

  @Post(':slug/orders')
  async createOrder(@Param('slug') slug: string, @Body() body: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Loja não encontrada');
    const tenantId = tenant.id;

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Carrinho vazio');
    }

    const total = body.items.reduce((sum: number, item: any) => {
      const addonsPrice = (item.addons || []).reduce((a: number, ad: any) => a + (ad.addonPrice || 0), 0);
      return sum + ((Number(item.price) || 0) + addonsPrice) * (item.quantity || 1);
    }, 0);

    const customerPhone = body.customerPhone?.replace(/\D/g, '') || null;
    let customerId: string | undefined;

    if (customerPhone) {
      const existing = await this.prisma.customer.findUnique({
        where: { tenantId_phone: { tenantId, phone: customerPhone } },
      });
      if (existing) customerId = existing.id;
    }

    const order = await this.prisma.order.create({
      data: {
        tenantId,
        customerId,
        customerName: body.customerName || null,
        customerPhone,
        notes: body.notes || null,
        total,
        items: {
          create: body.items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.productName || '',
            quantity: item.quantity || 1,
            price: Number(item.price) || 0,
            notes: item.notes || null,
            addons: item.addons && item.addons.length > 0 ? {
              create: item.addons.map((a: any) => ({
                addonName: a.addonName,
                addonPrice: Number(a.addonPrice) || 0,
                groupName: a.groupName,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        items: {
          include: { addons: true },
        },
      },
    });

    if (customerId) {
      await this.awardPoints(tenant, customerId, total);
    }

    return order;
  }

  @Get(':slug/orders')
  async listOrders(@Param('slug') slug: string, @Query('phone') phone?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) return [];
    const where: any = { tenantId: tenant.id };
    if (phone) {
      where.customerPhone = phone.replace(/\D/g, '');
    }
    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: { addons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':slug/orders/:id')
  async getOrder(@Param('slug') slug: string, @Param('id') id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Loja não encontrada');
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        items: {
          include: { addons: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  private async awardPoints(tenant: { id: string; settings?: any }, customerId: string, total: number) {
    if (!tenant.settings) {
      const full = await this.prisma.tenant.findUnique({ where: { id: tenant.id }, select: { settings: true } });
      if (!full?.settings) return;
      tenant.settings = full.settings;
    }
    const settings = tenant.settings as any;
    if (!settings.pointsEnabled) return;
    const rate = settings.pointsPerReais || 1;
    const points = Math.floor(total / rate);
    if (points > 0) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { points: { increment: points } },
      });
    }
  }
}
