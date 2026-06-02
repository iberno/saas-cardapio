import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const t = await p.tenant.findUnique({ where: { slug: 'el-sabor-acai' }, include: { tenantUsers: { select: { email: true, role: true } } } });
  if (t) console.log(`${t.name} (${t.slug}):`, t.tenantUsers.map(u => `${u.email} (${u.role})`).join(', '));
  else console.log('Tenant not found');
  await p.$disconnect();
}
main();
