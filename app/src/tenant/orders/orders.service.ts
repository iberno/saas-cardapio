import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string) {
    const where: Prisma.OrderWhereInput = { tenantId };
    if (status) {
      where.status = status as any;
    }
    return this.prisma.scoped.order.findMany({
      where,
      include: {
        items: {
          include: { addons: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, address: true, points: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.scoped.order.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: { addons: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, address: true, points: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  async create(tenantId: string, dto: CreateOrderDto) {
    const total = dto.items.reduce((sum, item) => {
      const addonsTotal = (item.addons || []).reduce((a, s) => a + s.addonPrice, 0);
      return sum + (item.price + addonsTotal) * item.quantity;
    }, 0);

    const order = await this.prisma.scoped.order.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        total,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            addons: item.addons ? {
              create: item.addons.map(addon => ({
                addonName: addon.addonName,
                addonPrice: addon.addonPrice,
                groupName: addon.groupName,
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

    // Award loyalty points if enabled
    await this.awardPointsIfEnabled(tenantId, dto.customerId, total);

    return order;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(tenantId, id);
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Pedido já cancelado');
    }
    return this.prisma.scoped.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: {
          include: { addons: true },
        },
      },
    });
  }

  async cancel(tenantId: string, id: string, userId?: string) {
    const order = await this.findOne(tenantId, id);
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Pedido já cancelado');
    }
    if (order.status === 'DELIVERED') {
      const thirtyMin = new Date(order.updatedAt.getTime() + 30 * 60 * 1000);
      if (new Date() > thirtyMin) {
        throw new BadRequestException('Prazo de 30 minutos para cancelamento expirou');
      }
    }
    return this.prisma.scoped.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        items: {
          include: { addons: true },
        },
      },
    });
  }

  private async awardPointsIfEnabled(tenantId: string, customerId: string | undefined, total: number) {
    if (!customerId) return;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    if (!tenant?.settings) return;
    const settings = tenant.settings as any;
    if (!settings.pointsEnabled) return;
    const rate = settings.pointsPerReais || 1;
    const points = Math.floor(total / rate);
    if (points > 0) {
      await this.prisma.scoped.customer.update({
        where: { id: customerId },
        data: { points: { increment: points } },
      });
    }
  }
}
