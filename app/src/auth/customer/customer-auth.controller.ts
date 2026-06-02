import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerAuthGuard } from '../../common/guards/customer-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private service: CustomerAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: CustomerLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.login(dto.phone, ip, ua);
    setCustomerCookies(res, accessToken, refreshToken);
    return { message: 'Authenticated' };
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
