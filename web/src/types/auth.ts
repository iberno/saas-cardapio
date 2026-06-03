export interface PlatformUser {
  id: string
  email: string
  name: string
  totpEnabled: boolean
  createdAt: string
}

export interface TenantUser {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'STAFF'
  totpEnabled: boolean
  tenantId: string
  createdAt: string
}

export interface CustomerTenantInfo {
  id: string
  name: string
  slug: string
  theme: unknown
  contactPhone: string | null
}

export interface Customer {
  id: string
  phone: string
  name: string | null
  points: number
  createdAt: string
  address?: string | null
  tenant?: CustomerTenantInfo
}

export interface LoginRequest {
  email: string
  password: string
}
