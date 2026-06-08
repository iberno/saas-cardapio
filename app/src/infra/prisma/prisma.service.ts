import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../../tenant/tenant-context';

const TENANT_SCOPED_MODELS = new Set([
  'TenantUser', 'Customer', 'Produto', 'CategoriaCardapio', 'Banner',
  'Order', 'OrderItem', 'OrderItemAddon', 'ProductReview',
]);

function injectTenantId(args: any, tenantId: string, operation: string) {
  if (['create', 'createMany'].includes(operation)) {
    return injectTenantIdCreate(args, tenantId, operation);
  }
  if (hasTenantIdInWhere(args.where)) return args;
  args.where = { ...args.where, tenantId };
  return args;
}

function hasTenantIdInWhere(where: any): boolean {
  if (!where) return false;
  if (where.tenantId) return true;
  for (const key of Object.keys(where)) {
    if (typeof where[key] === 'object' && where[key]?.tenantId) return true;
  }
  return false;
}

function injectTenantIdCreate(args: any, tenantId: string, _operation: string) {
  if (args.data?.tenantId) return args;
  args.data = { ...args.data, tenantId };
  return args;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private _scopedClient: this | null = null;

  constructor() {
    super();
    this._scopedClient = this._buildScopedClient();
  }

  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }

  get scoped(): this {
    return this._scopedClient!;
  }

  private _buildScopedClient() {
    const self = this;
    return self.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, model, operation }: any) {
            if (TENANT_SCOPED_MODELS.has(model)) {
              const ctx = TenantContext.get();
              if (ctx) {
                args = injectTenantId(args, ctx.tenantId, operation);
              } else if (!args.data?.tenantId && !hasTenantIdInWhere(args.where)) {
                throw new Error(`TenantContext required for ${model}.${operation}`);
              }
            }
            return query(args);
          },
        },
      },
    }) as unknown as this;
  }
}
