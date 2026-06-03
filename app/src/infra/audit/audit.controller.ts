import { Controller, Get, Query, Param, UseGuards, ForbiddenException } from '@nestjs/common'
import { AuditService } from './audit.service'
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('tenants/:tenantId/audit-logs')
export class AuditController {
  constructor(private service: AuditService) {}

  @UseGuards(TenantUserAuthGuard)
  @Get()
  async findAll(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    if (user.tenantId !== tenantId) throw new ForbiddenException()
    return this.service.findAll(tenantId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      action,
    })
  }
}
