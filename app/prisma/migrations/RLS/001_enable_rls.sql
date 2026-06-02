-- Run manually after prisma migrate
-- Enable RLS on tenant-scoped tables

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
