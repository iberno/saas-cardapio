import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { TenantUserAuthService } from './tenant-user-auth.service';
import { PasswordResetService } from '../shared/password-reset.service';
import { TenantUserLoginDto } from './dto/tenant-user-login.dto';
import { ForgotPasswordDto } from '../shared/dto/forgot-password.dto';
import { ResetPasswordDto } from '../shared/dto/reset-password.dto';
import { TenantUserAuthGuard } from '../../common/guards/tenant-user-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('tenant/auth')
export class TenantUserAuthController {
  constructor(
    private service: TenantUserAuthService,
    private passwordReset: PasswordResetService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: TenantUserLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const result = await this.service.login(dto.email, dto.password, ip, ua, dto.slug);
    if ('type' in result && result.type === 'totp_required') {
      return { requiresTotp: true, preAuthToken: result.preAuthToken };
    }
    const session = result as { accessToken: string; refreshToken: string };
    setTenantUserCookies(res, session.accessToken, session.refreshToken);
    return { message: 'Authenticated' };
  }

  @Post('login/totp')
  @HttpCode(200)
  async loginTotp(
    @Body() body: { preAuthToken: string; code: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.verifyTotpLogin(body.preAuthToken, body.code, ip, ua);
    setTenantUserCookies(res, accessToken, refreshToken);
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.tu_session_refresh;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setTenantUserCookies(res, accessToken, refreshToken);
    return { message: 'Refreshed' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto.email, 'TENANT_USER');
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto.token, dto.newPassword, 'TENANT_USER');
  }

  @UseGuards(TenantUserAuthGuard)
  @Post('totp/setup')
  @HttpCode(200)
  async setupTotp(@CurrentUser() user: any) {
    return this.service.setupTotp(user.sub);
  }

  @UseGuards(TenantUserAuthGuard)
  @Post('totp/enable')
  @HttpCode(200)
  async enableTotp(@CurrentUser() user: any, @Body() body: { code: string }) {
    return this.service.enableTotp(user.sub, body.code);
  }

  @UseGuards(TenantUserAuthGuard)
  @Post('totp/disable')
  @HttpCode(200)
  async disableTotp(@CurrentUser() user: any) {
    return this.service.disableTotp(user.sub);
  }

  @UseGuards(TenantUserAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(user.sub);
    clearTenantUserCookies(res);
    return { message: 'Logged out' };
  }

  @UseGuards(TenantUserAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub, user.tenantId);
  }
}

function setTenantUserCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('tu_session', accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 15 * 60 * 1000 });
  res.cookie('tu_session_refresh', refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearTenantUserCookies(res: Response) {
  res.clearCookie('tu_session', { path: '/' });
  res.clearCookie('tu_session_refresh', { path: '/' });
}
