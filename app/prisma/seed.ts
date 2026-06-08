import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@saas-cardapio.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123@senha';
  const ownerEmail = process.env.SEED_TENANT_OWNER_EMAIL || 'owner@acai.local';
  const ownerPassword = process.env.SEED_TENANT_OWNER_PASSWORD || 'Admin123@senha';

  const adminHash = await argon2.hash(adminPassword);
  const ownerHash = await argon2.hash(ownerPassword);

  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: adminHash, name: 'Admin' },
  });
  console.log('PlatformAdmin:', platformAdmin.email);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acai' },
    update: {},
    create: {
      slug: 'acai',
      name: 'El Sabor Açaí',
      status: 'ACTIVE',
      contactEmail: 'contato@elsaboracai.com.br',
      contactPhone: '(11) 99999-9999',
      settings: {
        hoursText: 'Seg-Sex: 08h-12h e 14h-19h\nSáb: 09h-17h',
      },
    },
  });
  console.log('Tenant:', tenant.slug, tenant.id);

  const tenantUser = await prisma.tenantUser.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash: ownerHash,
      name: 'Dono Açaí',
      role: 'OWNER',
    },
  });
  console.log('TenantUser:', tenantUser.email, tenantUser.role);

  const customer = await prisma.customer.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '+5511999999999' } },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+5511999999999',
      name: 'João Cliente',
    },
  });
  console.log('Customer:', customer.phone);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
