import { Link, useLocation } from '@tanstack/react-router'
import { Store, ClipboardList, LayoutDashboard, LogOut, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  showFor: 'platform' | 'tenant' | 'both'
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    showFor: 'both',
  },
  {
    label: 'Lojas',
    path: '/admin/lojas',
    icon: Store,
    showFor: 'platform',
  },
  {
    label: 'Cardápio',
    path: '/admin/loja',
    icon: ClipboardList,
    showFor: 'tenant',
  },
]

interface AdminSidebarProps {
  onClose?: () => void
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const { pathname } = useLocation()
  const { isPlatform, logout } = useAuth()

  return (
    <aside className="h-full bg-neutral border-r border-base-300 flex flex-col">
      <div className="h-16 flex items-center justify-between px-4 border-b border-base-300 shrink-0">
        <Link to="/" className="text-lg font-bold text-white">
          Saas Cardapio
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter(
            (item) =>
              item.showFor === 'both' ||
              (item.showFor === 'platform' && isPlatform) ||
              (item.showFor === 'tenant' && !isPlatform),
          )
          .map((item) => {
            const isActive =
              pathname === item.path ||
              pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-white/60 hover:text-white hover:bg-base-300'
                }`}
                onClick={onClose}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
      </nav>

      <div className="p-4 border-t border-base-300 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-base-300 w-full transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
