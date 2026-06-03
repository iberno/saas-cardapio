import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
