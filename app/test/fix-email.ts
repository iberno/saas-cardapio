import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const t = await p.tenant.findUnique({ where: { slug: 'el-sabor-acai' } });
  if (!t) { console.log('Tenant not found'); return; }
  const u = await p.tenantUser.findFirst({ where: { tenantId: t.id, email: 'owner@saboracai.local' } });
  if (!u) { console.log('User not found'); return; }
  await p.tenantUser.update({ where: { id: u.id }, data: { email: 'owner@elsaboracai.local' } });
  console.log('Email updated to owner@elsaboracai.local');
  await p.$disconnect();
}
main();
