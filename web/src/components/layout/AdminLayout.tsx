import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { useAuth } from '../../lib/auth-context'
import { Spinner } from '../ui'
import type { TenantUser, PlatformUser } from '../../types'

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const displayName = user
    ? 'name' in user
      ? (user as TenantUser).name
      : (user as PlatformUser).email
    : ''

  return (
    <div className="min-h-screen bg-base-200 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-neutral border-b border-base-300 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            className="text-white/60 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-white/60">{displayName}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
