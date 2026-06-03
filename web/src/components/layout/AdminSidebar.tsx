import { Link, useLocation } from '@tanstack/react-router'
import { Store, ClipboardList, LayoutDashboard, LogOut, X, Palette, FolderTree, Image, Images, Settings, ShoppingCart, Shield, Users, History } from 'lucide-react'
import { ThemeToggle } from '../ui/ThemeToggle'
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
    label: 'Pedidos',
    path: '/admin/loja/pedidos',
    icon: ShoppingCart,
    showFor: 'tenant',
  },
  {
    label: 'Cardápio',
    path: '/admin/loja/cardapio',
    icon: ClipboardList,
    showFor: 'tenant',
  },
  {
    label: 'Categorias',
    path: '/admin/loja/categorias',
    icon: FolderTree,
    showFor: 'tenant',
  },
  {
    label: 'Aparência',
    path: '/admin/loja/aparencia',
    icon: Palette,
    showFor: 'tenant',
  },
  {
    label: 'Banners',
    path: '/admin/loja/banners',
    icon: Image,
    showFor: 'tenant',
  },
  {
    label: 'Galeria',
    path: '/admin/loja/galeria',
    icon: Images,
    showFor: 'tenant',
  },
  {
    label: 'Configurações',
    path: '/admin/loja/configuracoes',
    icon: Settings,
    showFor: 'tenant',
  },
  {
    label: 'Auditoria',
    path: '/admin/loja/auditoria',
    icon: History,
    showFor: 'tenant',
  },
  {
    label: 'Segurança',
    path: '/admin/loja/seguranca',
    icon: Shield,
    showFor: 'tenant',
  },
  {
    label: 'Equipe',
    path: '/admin/loja/equipe',
    icon: Users,
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

      <div className="p-4 border-t border-base-300 shrink-0 space-y-1">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-white/60">
          <span>Tema</span>
          <ThemeToggle />
        </div>
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
