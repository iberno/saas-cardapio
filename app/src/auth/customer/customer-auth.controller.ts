import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';
import { TenantContext } from '../../tenant/tenant-context';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('customer/auth')
export class CustomerAuthController {
  constructor(
    private service: CustomerAuthService,
    private prisma: PrismaService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: CustomerLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];

    if (dto.slug) {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
      if (!tenant) throw new NotFoundException('Tenant not found');
      return TenantContext.run({ tenantId: tenant.id, slug: tenant.slug }, async () => {
        const { accessToken, refreshToken } = await this.service.login(dto.phone, ip, ua);
        setCustomerCookies(res, accessToken, refreshToken);
        return { message: 'Authenticated' };
      });
    }

    const { accessToken, refreshToken } = await this.service.login(dto.phone, ip, ua);
    setCustomerCookies(res, accessToken, refreshToken);
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.cu_refresh;
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setCustomerCookies(res, accessToken, refreshToken);
    return { message: 'Refreshed' };
  }

  @UseGuards(CustomerAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub, user.tenantId);
  }
}

function setCustomerCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('cu_session', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 15 * 60 * 1000 });
  res.cookie('cu_refresh', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
