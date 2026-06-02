import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../../tenant/tenant-context';

const TENANT_SCOPED_MODELS = new Set(['TenantUser', 'Customer']);

function injectTenantId(args: any, tenantId: string, operation: string) {
  if (['create', 'createMany'].includes(operation)) {
    return injectTenantIdCreate(args, tenantId, operation);
  }
  if (args.where?.tenantId) return args;
  args.where = { ...args.where, tenantId };
  return args;
}

function injectTenantIdCreate(args: any, tenantId: string, operation: string) {
  if (operation === 'create') {
    args.data = { ...args.data, tenantId };
  }
  if (operation === 'createMany') {
    args.data = args.data.map((d: any) => ({ ...d, tenantId }));
  }
  return args;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _scopedClient: this | null = null;
  private _platformClient: PrismaClient | null = null;

  constructor() {
    super();
    this._scopedClient = this._buildScopedClient();
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }

  get scoped(): this {
    return this._scopedClient!;
  }

  platform(): PrismaClient {
    if (!this._platformClient) {
      this._platformClient = new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_PLATFORM_URL } },
      });
    }
    return this._platformClient;
  }

  private _buildScopedClient() {
    const self = this;
    return self.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, model, operation }: any) {
            if (TENANT_SCOPED_MODELS.has(model)) {
              const ctx = TenantContext.get();
              if (!ctx) throw new Error(`TenantContext required for ${model}.${operation}`);
              args = injectTenantId(args, ctx.tenantId, operation);
            }
            return query(args);
          },
        },
      },
    }) as unknown as this;
  }
}
