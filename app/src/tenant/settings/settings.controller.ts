import { Controller, Get, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tenants/:tenantId/settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.service.getSettings(tenantId);
  }

  @UseGuards(TenantUserAuthGuard)
  @Put()
  async update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    if (user.tenantId !== tenantId) throw new ForbiddenException();
    return this.service.updateSettings(tenantId, dto);
  }
}
