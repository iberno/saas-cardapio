import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.pa_session;
    if (!token) throw new UnauthorizedException('Missing platform auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'platform') throw new UnauthorizedException('Invalid audience');
      req.user = { sub: payload.sub, aud: payload.aud };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
