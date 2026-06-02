import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
async function main() {
  const p = new PrismaClient();
  const t = await p.tenant.findUnique({ where: { slug: 'el-sabor-acai' } });
  if (!t) { console.log('Tenant not found'); return; }
  const u = await p.tenantUser.findFirst({ where: { tenantId: t.id } });
  if (!u) { console.log('User not found'); return; }
  const hash = await argon2.hash('Admin123@senha', { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
  await p.tenantUser.update({ where: { id: u.id }, data: { passwordHash: hash } });
  console.log('Password hash updated for', u.email);
  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
