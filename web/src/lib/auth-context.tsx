import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { api } from './api-client'
import type { PlatformUser, TenantUser } from '../types'

type User = PlatformUser | TenantUser | null

interface AuthContextValue {
  user: User
  loading: boolean
  isPlatform: boolean
  login: (email: string, password: string, type: 'platform' | 'tenant') => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const [authType, setAuthType] = useState<'platform' | 'tenant' | null>(() =>
    localStorage.getItem('auth_type') as 'platform' | 'tenant' | null,
  )

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const storedType = localStorage.getItem('auth_type')
      const endpoint =
        storedType === 'platform'
          ? '/auth/platform/me'
          : '/auth/tenant-user/me'
      const data = await api.get<User>(endpoint)
      setUser(data)
      setAuthType(storedType as 'platform' | 'tenant' | null)
    } catch {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_type')
      setAuthType(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string, type: 'platform' | 'tenant') => {
      const endpoint =
        type === 'platform'
          ? '/auth/platform/login'
          : '/auth/tenant-user/login'
      const { access_token } = await api.post<{ access_token: string }>(
        endpoint,
        { email, password },
      )
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('auth_type', type)
      setAuthType(type)
      await fetchUser()
    },
    [fetchUser],
  )

  const logout = useCallback(() => {
    setUser(null)
    setAuthType(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_type')
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPlatform: authType === 'platform',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
