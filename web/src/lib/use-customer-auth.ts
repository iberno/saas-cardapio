import { useState, useEffect, useCallback } from 'react'
import { api } from './api-client'
import type { Customer } from '../types'

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<Customer>('/customer/auth/me')
      setCustomer(data)
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const login = async (phone: string, slug?: string) => {
    const e164 = phone.startsWith('+') ? phone : `+${phone}`
    await api.post('/customer/auth/login', { phone: e164, slug })
    await fetch()
  }

  const logout = async () => {
    try { await api.post('/customer/auth/logout') } catch {}
    setCustomer(null)
  }

  return { customer, loading, login, logout }
}
