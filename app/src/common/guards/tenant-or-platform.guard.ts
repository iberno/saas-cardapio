import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantOrPlatformGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const tuToken = req.cookies?.tu_session;
    const paToken = req.cookies?.pa_session;
    const token = tuToken || paToken;

    if (!token) throw new UnauthorizedException('Authentication required');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const allowedAudiences = ['tenant-user', 'platform'];
      if (!allowedAudiences.includes(payload.aud)) {
        throw new UnauthorizedException('Invalid audience');
      }
      req.user = payload;

      if (payload.aud === 'tenant-user') {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (requiredRoles?.length) {
          const userRoles = payload.roles || [];
          const hasRole = requiredRoles.some((r) => userRoles.includes(r));
          if (!hasRole) throw new ForbiddenException('Insufficient permissions');
        }
      }

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
