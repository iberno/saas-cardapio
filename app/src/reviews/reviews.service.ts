import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, tenantId: string, dto: CreateReviewDto) {
    const produto = await this.prisma.produto.findUnique({
      where: { id: dto.productId },
      select: { tenantId: true, nome: true },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    if (produto.tenantId !== tenantId) throw new NotFoundException('Produto não encontrado');

    const existing = await this.prisma.productReview.findUnique({
      where: { customerId_productId: { customerId, productId: dto.productId } },
    });
    if (existing) throw new ConflictException('Você já avaliou este produto');

    return this.prisma.productReview.create({
      data: {
        tenantId,
        productId: dto.productId,
        customerId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        customer: { select: { name: true } },
      },
    });
  }

  async findByProduct(productId: string, tenantId: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id: productId },
      select: { tenantId: true },
    });
    if (!produto || produto.tenantId !== tenantId) throw new NotFoundException('Produto não encontrado');

    const reviews = await this.prisma.productReview.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
      },
    });

    const stats = await this.getStats(productId);

    return { reviews, stats };
  }

  async findMyReviews(customerId: string, tenantId: string) {
    return this.prisma.productReview.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        produto: { select: { id: true, nome: true, imagemUrl: true } },
      },
    });
  }

  async getStats(productId: string) {
    const aggr = await this.prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    const distribution = await this.prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId },
      _count: true,
    });

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count;
    }

    return {
      average: aggr._avg.rating ? Math.round(aggr._avg.rating * 10) / 10 : 0,
      total: aggr._count,
      distribution: dist,
    };
  }
}
