import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';
import { TenantContext } from './tenant-context';

const SKIP_PATHS = ['/api/health', '/api/platform', '/api/auth/csrf'];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (SKIP_PATHS.some((p) => req.path.startsWith(p))) return next();

    const host = req.headers.host || '';
    const slug = this.extractSubdomain(host);
    if (slug) {
      try {
        const tenant = await this.tenantService.findBySlug(slug);
        TenantContext.run({ tenantId: tenant.id, slug: tenant.slug }, () => next());
      } catch {
        return next();
      }
      return;
    }

    const tenantId = this.extractTenantIdFromPath(req.originalUrl || req.path);
    if (tenantId) {
      TenantContext.run({ tenantId }, () => next());
      return;
    }

    return next();
  }

  private extractSubdomain(host: string): string | null {
    const base = process.env.COOKIE_DOMAIN_BASE || 'saas-cardapio.local';
    const escaped = base.replaceAll('.', '\\.');
    const match = host.match(new RegExp(`^([a-z0-9-]+)\\.${escaped}`));
    return match ? match[1] : null;
  }

  private extractTenantIdFromPath(path: string): string | null {
    const match = path.match(/^\/api\/tenants\/([a-f0-9-]+)\b/);
    return match ? match[1] : null;
  }
}
