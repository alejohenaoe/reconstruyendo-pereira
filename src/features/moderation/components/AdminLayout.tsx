import { NavLink, Outlet } from 'react-router-dom'

import { AppHeader } from '@/shared/components/AppHeader'

const navItemClass = ({ isActive }: { isActive: boolean }): string =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-closed-600 hover:bg-arena-100 hover:text-closed-800'
  }`

const items = [
  { to: '/admin', label: 'Resumen', end: true },
  { to: '/admin/reports', label: 'Reportes', end: false },
  { to: '/admin/users', label: 'Usuarios', end: false },
  { to: '/admin/needs', label: 'Pedidos de ayuda', end: false },
]

/** Layout del panel admin: cabecera global + navegación lateral. */
export function AdminLayout() {
  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-1 md:flex-col" aria-label="Panel de administración">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navItemClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex min-w-0 flex-col gap-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
