import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { TokenService } from '../../auth/shared/token.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('tenants/:tenantId/banners')
export class BannersController {
  constructor(
    private service: BannersService,
    private tokenService: TokenService,
  ) {}

  private verifyAuth(cookies: Record<string, string> | undefined) {
    const token = cookies?.tu_session || cookies?.pa_session;
    if (!token) throw new UnauthorizedException();
    this.tokenService.verifyAccessToken(token);
  }

  @Get()
  findAll(@Param('tenantId') tenantId: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.findAll(tenantId);
  }

  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateBannerDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    this.verifyAuth(req.cookies);
    return this.service.remove(id);
  }
}
