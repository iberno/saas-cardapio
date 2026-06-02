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

export interface Customer {
  id: string
  phone: string
  name: string | null
  points: number
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}
