import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../../auth/shared/token.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantUserAuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.tu_session;
    if (!token) throw new UnauthorizedException('Missing tenant user auth cookie');

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      if (payload.aud !== 'tenant-user') throw new UnauthorizedException('Invalid audience');
      req.user = payload;

      const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
      if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = payload.roles || [];
        const hasRole = requiredRoles.some((r) => userRoles.includes(r));
        if (!hasRole) throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
