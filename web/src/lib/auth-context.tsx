import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { api } from './api-client'
import { loginTotp } from '../services/auth.service'
import type { PlatformUser, TenantUser } from '../types'

type User = PlatformUser | TenantUser | null

interface AuthContextValue {
  user: User
  loading: boolean
  isPlatform: boolean
  login: (email: string, password: string, type: 'platform' | 'tenant', slug?: string) => Promise<{ requiresTotp: true; preAuthToken: string } | void>
  verifyTotpLogin: (preAuthToken: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const [authType, setAuthType] = useState<'platform' | 'tenant' | null>(null)
  const pendingAuthType = useRef<'platform' | 'tenant'>('tenant')

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<User>('/platform/auth/me')
      setUser(data)
      setAuthType('platform')
    } catch {
      try {
        const data = await api.get<User>('/tenant/auth/me')
        setUser(data)
        setAuthType('tenant')
      } catch {
        setUser(null)
        setAuthType(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string, type: 'platform' | 'tenant', slug?: string) => {
      const endpoint = type === 'platform' ? '/platform/auth/login' : '/tenant/auth/login'
      const body: Record<string, string> = { email, password }
      if (slug) body.slug = slug
      const result = await api.post<{ message?: string; requiresTotp?: true; preAuthToken?: string }>(endpoint, body)
      if (result.requiresTotp && result.preAuthToken) {
        pendingAuthType.current = type
        return { requiresTotp: true as const, preAuthToken: result.preAuthToken }
      }
      await fetchUser()
    },
    [fetchUser],
  )

  useEffect(() => {
    const handler = () => {
      if (window.location.pathname === '/login') return
      setUser(null)
      setAuthType(null)
      window.location.href = '/login'
    }
    window.addEventListener('auth-expired', handler)
    return () => window.removeEventListener('auth-expired', handler)
  }, [])

  const verifyTotpLogin = useCallback(
    async (preAuthToken: string, code: string) => {
      await loginTotp(preAuthToken, code, pendingAuthType.current)
      await fetchUser()
    },
    [fetchUser],
  )

  const logout = useCallback(async () => {
    try {
      if (authType === 'platform') {
        await api.post('/platform/auth/logout')
      } else {
        await api.post('/tenant/auth/logout')
      }
    } catch {}
    setUser(null)
    setAuthType(null)
    window.location.href = '/login'
  }, [authType])

  return (
    <AuthContext.Provider value={{ user, loading, isPlatform: authType === 'platform', login, verifyTotpLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
