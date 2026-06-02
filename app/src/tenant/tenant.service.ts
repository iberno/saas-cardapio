import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class TenantService {
  private cache = new Map<string, { id: string; slug: string; status: string }>();
  private cacheTTL = 60_000;

  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const cached = this.cache.get(slug);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.status !== 'ACTIVE') {
      throw new HttpException('Tenant is suspended', HttpStatus.FORBIDDEN);
    }

    const data = { id: tenant.id, slug: tenant.slug, status: tenant.status };
    this.cache.set(slug, data);
    setTimeout(() => this.cache.delete(slug), this.cacheTTL);

    return data;
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }
}
