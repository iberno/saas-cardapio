import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
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
