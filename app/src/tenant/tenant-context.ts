import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  slug?: string;
}

const als = new AsyncLocalStorage<TenantContextData>();

export const TenantContext = {
  run: (data: TenantContextData, fn: () => any) => als.run(data, fn),

  set: (data: TenantContextData) => als.enterWith(data),

  get: (): TenantContextData | undefined => als.getStore(),

  require: (): TenantContextData => {
    const ctx = als.getStore();
    if (!ctx) throw new Error('TenantContext not set');
    return ctx;
  },

  has: (): boolean => !!als.getStore(),
};
