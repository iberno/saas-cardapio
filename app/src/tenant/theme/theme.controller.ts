import { Controller, Get, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tenants/:tenantId/theme')
export class ThemeController {
  constructor(private service: ThemeService) {}

  @Get()
  get(@Param('tenantId') tenantId: string) {
    return this.service.getTheme(tenantId);
  }

  @UseGuards(TenantUserAuthGuard)
  @Put()
  async update(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateThemeDto,
    @CurrentUser() user: any,
  ) {
    if (user.tenantId !== tenantId) throw new ForbiddenException();
    return this.service.updateTheme(tenantId, dto as Record<string, string>);
  }
}
