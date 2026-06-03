import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { TenantOrPlatformGuard } from '../../common/guards/tenant-or-platform.guard';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@UseGuards(TenantOrPlatformGuard)
@Controller('tenants/:tenantId/banners')
export class BannersController {
  constructor(private service: BannersService) {}

  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateBannerDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
