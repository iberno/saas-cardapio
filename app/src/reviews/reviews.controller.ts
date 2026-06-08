import { Controller, Post, Get, Param, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../infra/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CustomerAuthGuard } from '../common/guards/customer-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class ReviewsController {
  constructor(
    private service: ReviewsService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(CustomerAuthGuard)
  @Post('customer/reviews')
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.service.create(user.sub, user.tenantId, dto);
  }

  @UseGuards(CustomerAuthGuard)
  @Get('customer/reviews')
  myReviews(@CurrentUser() user: any) {
    return this.service.findMyReviews(user.sub, user.tenantId);
  }

  @Get('public/:slug/produtos/:productId/reviews')
  async findByProduct(@Param('slug') slug: string, @Param('productId') productId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Loja não encontrada');
    return this.service.findByProduct(productId, tenant.id);
  }
}
