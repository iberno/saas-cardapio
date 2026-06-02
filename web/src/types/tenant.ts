export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED'

export interface Tenant {
  id: string
  slug: string
  name: string
  status: TenantStatus
  contactEmail: string
  contactPhone?: string | null
  ownerEmail?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateTenantRequest {
  slug: string
  name: string
  contactEmail: string
  contactPhone?: string
  ownerEmail?: string
  ownerPassword?: string
}

export interface UpdateTenantRequest {
  name?: string
  contactEmail?: string
  contactPhone?: string
}

export interface UpdateTenantStatusRequest {
  status: TenantStatus
}
