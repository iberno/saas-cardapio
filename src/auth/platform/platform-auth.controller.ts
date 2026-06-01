import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformLoginDto } from './dto/login.dto';
import { PlatformAuthGuard } from '../../common/guards/platform-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response, Request } from 'express';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private service: PlatformAuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: PlatformLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.login(dto.email, dto.password, ip, ua);
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Authenticated' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.pa_session_refresh;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'];
    const { accessToken, refreshToken } = await this.service.refresh(token, ip, ua);
    setCookies(res, accessToken, refreshToken, 'pa_session', 'platform');
    return { message: 'Refreshed' };
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
