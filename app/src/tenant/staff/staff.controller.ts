import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common'
import { StaffService } from './staff.service'
import { CreateStaffDto } from './dto/create-staff.dto'
import { UpdateStaffDto } from './dto/update-staff.dto'
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('tenants/:tenantId/staff')
export class StaffController {
  constructor(private service: StaffService) {}

  @UseGuards(TenantUserAuthGuard)
  @Roles('OWNER')
  @Get()
  findAll(@Param('tenantId') tenantId: string, @CurrentUser() user: any) {
    if (user.tenantId !== tenantId) throw new ForbiddenException()
    return this.service.findAll(tenantId)
  }

  @UseGuards(TenantUserAuthGuard)
  @Roles('OWNER')
  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateStaffDto, @CurrentUser() user: any) {
    if (user.tenantId !== tenantId) throw new ForbiddenException()
    return this.service.create(tenantId, dto)
  }

  @UseGuards(TenantUserAuthGuard)
  @Roles('OWNER')
  @Patch(':id')
  update(@Param('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateStaffDto, @CurrentUser() user: any) {
    if (user.tenantId !== tenantId) throw new ForbiddenException()
    return this.service.update(tenantId, id, dto)
  }

  @UseGuards(TenantUserAuthGuard)
  @Roles('OWNER')
  @Delete(':id')
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string, @CurrentUser() user: any) {
    if (user.tenantId !== tenantId) throw new ForbiddenException()
    return this.service.remove(tenantId, id)
  }
}
