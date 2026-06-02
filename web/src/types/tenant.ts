export interface Tenant {
  id: string
  name: string
  subdomain: string
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
  createdAt: string
  updatedAt: string
}

export interface CreateTenantRequest {
  name: string
  subdomain: string
}

export interface UpdateTenantStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
}
