import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FindAllParams {
  page: number;
  limit: number;
  action?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId?: string;
    actorType: 'PLATFORM_ADMIN' | 'TENANT_USER' | 'CUSTOMER';
    actorId: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
    ip?: string;
  }) {
    await this.prisma.auditLog.create({ data: params as any }).catch(() => {
      // audit failure should never break the app
    });
  }

  async findAll(tenantId: string, opts: FindAllParams) {
    const where: any = { tenantId }
    if (opts.action) where.action = opts.action

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { data, total, page: opts.page, limit: opts.limit }
  }
}
