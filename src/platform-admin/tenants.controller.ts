import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PlatformAuthGuard } from '../common/guards/platform-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { TenantStatus } from '@prisma/client';

@Controller('platform/tenants')
@UseGuards(PlatformAuthGuard)
export class TenantsController {
  constructor(private service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.service.updateStatus(id, dto.status as TenantStatus);
  }
}
