import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.service.findAll(tenantId, status);
  }

  @Get('export')
  async exportCsv(@Param('tenantId') tenantId: string, @Query('status') status: string | undefined, @Res() res: Response) {
    const orders = await this.service.findAll(tenantId, status);
    const csv = this.service.toCsv(orders);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pedidos-${tenantId.slice(0, 8)}.csv"`);
    res.send('\uFEFF' + csv);
  }

  @Get(':id')
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateOrderDto) {
    return this.service.create(tenantId, dto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(tenantId, id, dto);
  }

  @Put(':id/cancel')
  cancel(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.service.cancel(tenantId, id);
  }
}
