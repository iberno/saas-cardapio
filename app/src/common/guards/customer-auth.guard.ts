import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.cu_session;
    if (!token) throw new UnauthorizedException('Missing customer auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'customer') throw new UnauthorizedException('Invalid audience');
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
