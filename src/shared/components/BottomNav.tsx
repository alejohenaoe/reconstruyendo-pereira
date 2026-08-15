import { Link, NavLink } from 'react-router-dom'

import { Bell, HeartHandshake, Home, Plus, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  badge?: number
}

const LEFT_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/needs', label: 'Pedidos', icon: HeartHandshake },
]

const RIGHT_ITEMS: NavItem[] = [
  { to: '/notifications', label: 'Avisos', icon: Bell },
  { to: '/account', label: 'Perfil', icon: User },
]

function NavItemView({ to, label, icon: Icon, end, badge }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-2.5 text-[11px] font-medium ${
          isActive ? 'text-brand-700' : 'text-closed-500 hover:text-closed-700'
        }`
      }
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
      {badge && badge > 0 ? (
        <span className="bg-brand-600 absolute top-0.5 left-1/2 -translate-x-1/2 translate-x-2 rounded-full px-1.5 py-px text-[10px] font-semibold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

/** Barra de navegación inferior en móvil para usuarios autenticados (UX §6.1). */
export function BottomNav() {
  const { status } = useAuth()
  const { unread } = useUnreadCount()

  if (status !== 'AUTHENTICATED') return null

  return (
    <nav
      aria-label="Navegación principal"
      className="border-arena-200 fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex w-full max-w-md items-end justify-around">
        {LEFT_ITEMS.map((item) => (
          <NavItemView key={item.to} {...item} />
        ))}

        <Link
          to="/needs/new"
          className="relative flex -translate-y-3 flex-col items-center"
          aria-label="Publicar pedido de ayuda"
        >
          <span className="bg-brand-600 flex size-12 items-center justify-center rounded-full text-white shadow-lg">
            <Plus className="size-6" aria-hidden="true" />
          </span>
          <span className="text-brand-800 mt-0.5 text-[11px] font-semibold">Publicar</span>
        </Link>

        {RIGHT_ITEMS.map((item) => (
          <NavItemView
            key={item.to}
            {...item}
            badge={item.to === '/notifications' ? unread : undefined}
          />
        ))}
      </div>
    </nav>
  )
}
