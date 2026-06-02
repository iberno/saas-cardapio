export interface LoginRequest {
  email: string
  password: string
}

export interface PlatformLoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
}

export interface PlatformUser {
  id: string
  email: string
  role: 'PLATFORM_ADMIN' | 'PLATFORM_VIEWER'
}

export interface TenantUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'STAFF'
  tenantId: string
}

export interface Customer {
  id: string
  email: string
  name: string
}
