import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, UnauthorizedException } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { PasswordResetService } from '../shared/password-reset.service';
import { PlatformLoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from '../shared/dto/forgot-password.dto';
import { ResetPasswordDto } from '../shared/dto/reset-password.dto';
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(
    private service: PlatformAuthService,
    private passwordReset: PasswordResetService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: PlatformLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const result = await this.service.login(dto.email, dto.password, ip, ua);
    if ('type' in result && result.type === 'totp_required') {
      return { requiresTotp: true, preAuthToken: result.preAuthToken };
    }
    const session = result as { accessToken: string; refreshToken: string };
    setCookies(res, session.accessToken, session.refreshToken, 'pa_session', 'platform');
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
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.pa_session_refresh;
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Refreshed' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto.email, 'PLATFORM_ADMIN');
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto.token, dto.newPassword, 'PLATFORM_ADMIN');
  }

  @UseGuards(PlatformAuthGuard)
  @Post('totp/setup')
  @HttpCode(200)
  async setupTotp(@CurrentUser() user: any) {
    return this.service.setupTotp(user.sub);
  }

  @UseGuards(PlatformAuthGuard)
  @Post('totp/enable')
  @HttpCode(200)
  async enableTotp(@CurrentUser() user: any, @Body() body: { code: string }) {
    return this.service.enableTotp(user.sub, body.code);
  }

  @UseGuards(PlatformAuthGuard)
  @Post('totp/disable')
  @HttpCode(200)
  async disableTotp(@CurrentUser() user: any) {
    return this.service.disableTotp(user.sub);
  }

  @UseGuards(PlatformAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(user.sub);
    clearCookies(res, 'pa_session', 'platform');
    return { message: 'Logged out' };
  }

  @UseGuards(PlatformAuthGuard)
  @Get('me')
  me(@CurrentUser() user: any) {
    return this.service.me(user.sub);
  }
}

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  const base = process.env.COOKIE_DOMAIN_BASE;
  return base ? `.${base}` : undefined;
}

function setCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  namePrefix: string,
  _aud: string,
) {
  const domain = cookieDomain();
  const secure = process.env.NODE_ENV === 'production';
  const sameSite: 'lax' = 'lax';
  res.cookie(`${namePrefix}`, accessToken, {
    domain, httpOnly: true, secure, sameSite, path: '/', maxAge: 15 * 60 * 1000,
  });
  res.cookie(`${namePrefix}_refresh`, refreshToken, {
    domain, httpOnly: true, secure, sameSite, path: '/', maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookies(res: Response, namePrefix: string, _aud: string) {
  const domain = cookieDomain();
  res.clearCookie(`${namePrefix}`, { domain });
  res.clearCookie(`${namePrefix}_refresh`, { domain });
}
