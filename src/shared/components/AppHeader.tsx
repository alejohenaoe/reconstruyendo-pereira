import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  Bell,
  ClipboardList,
  HandHeart,
  LogIn,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  User,
} from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { buttonStyles } from '@/shared/components/buttonStyles'
import { BottomNav } from '@/shared/components/BottomNav'
import { BrandMark } from '@/shared/components/BrandMark'

const menuItemClass =
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-closed-700 hover:bg-arena-100'

/** Cabecera global mínima (UX_UI_GUIDELINES.md §6). Refleja el estado de auth. */
export function AppHeader() {
  const { status, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAdmin = useIsAdmin(user?.id ?? null)
  const { unread, refresh } = useUnreadCount()
  const canUseNotifications = status === 'AUTHENTICATED'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('mousedown', onPointerDown)
      return () => {
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('mousedown', onPointerDown)
      }
    }
  }, [menuOpen])

  async function handleSignOut() {
    setSigningOut(true)
    setMenuOpen(false)
    try {
      await signOut()
      navigate('/')
    } finally {
      setSigningOut(false)
    }
  }

  const unreadLabel = `Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`

  const notificationsLink = (closeOnClick: boolean) => (
    <Link
      to="/notifications"
      onClick={() => {
        void refresh()
        if (closeOnClick) setMenuOpen(false)
      }}
      aria-label={unreadLabel}
      className="text-closed-600 hover:text-brand-700 relative text-sm font-medium"
    >
      Notificaciones
      {unread > 0 ? (
        <span className="bg-brand-600 absolute -top-1.5 -right-2.5 rounded-full px-1.5 py-px text-[10px] font-semibold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  )

  return (
    <>
      <header className="border-arena-200 sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" aria-label="Reconstruyamos" className="flex items-center">
              <BrandMark size={28} />
            </Link>
            <Link
              to="/needs"
              className="text-closed-600 hover:text-brand-700 hidden text-sm font-medium md:inline"
            >
              Pedidos de ayuda
            </Link>
          </div>

          <div ref={menuRef} className="relative flex items-center gap-3">
            {/* Desktop */}
            <nav className="hidden items-center gap-3 md:flex" aria-label="Acceso">
              {status === 'AUTH_LOADING' ? null : status === 'UNAUTHENTICATED' ? (
                <Link to="/login" className={buttonStyles({ variant: 'primary', size: 'md' })}>
                  Ingresar
                </Link>
              ) : (
                <>
                  {status === 'EMAIL_UNVERIFIED' ? (
                    <Link
                      to="/verify-email"
                      className="text-warning-600 text-sm font-medium hover:underline"
                    >
                      Verificar correo
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/needs/new"
                        className={buttonStyles({ variant: 'secondary', size: 'md' })}
                      >
                        Publicar
                      </Link>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          className="text-brand-700 text-sm font-medium hover:underline"
                        >
                          Admin
                        </Link>
                      ) : null}
                      {canUseNotifications ? notificationsLink(false) : null}
                      <Link
                        to="/account"
                        className="text-closed-600 hover:text-brand-700 text-sm font-medium"
                      >
                        {String(user?.user_metadata.display_name ?? 'Mi cuenta')}
                      </Link>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-closed-500 hover:text-closed-800 text-sm font-medium disabled:opacity-60"
                  >
                    Salir
                  </button>
                </>
              )}
            </nav>

            {/* Móvil: botón menú */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="text-closed-600 hover:text-closed-800 md:hidden"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>

            {/* Menú móvil: dropdown */}
            {menuOpen ? (
              <div
                role="menu"
                aria-label="Menú"
                className="border-arena-200 absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border bg-white p-2 shadow-lg md:hidden"
              >
                {status === 'AUTH_LOADING' ? null : status === 'UNAUTHENTICATED' ? (
                  <>
                    <Link
                      to="/needs"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <HandHeart className="size-5" aria-hidden="true" />
                      Pedidos de ayuda
                    </Link>
                    <Link
                      to="/login"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <LogIn className="size-5" aria-hidden="true" />
                      Ingresar
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/needs"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <HandHeart className="size-5" aria-hidden="true" />
                      Pedidos de ayuda
                    </Link>
                    {status === 'EMAIL_UNVERIFIED' ? (
                      <Link
                        to="/verify-email"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Bell className="size-5" aria-hidden="true" />
                        Verificar correo
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/needs/new"
                          role="menuitem"
                          className={menuItemClass}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Plus className="size-5" aria-hidden="true" />
                          Publicar pedido de ayuda
                        </Link>
                        <Link
                          to="/my-needs"
                          role="menuitem"
                          className={menuItemClass}
                          onClick={() => setMenuOpen(false)}
                        >
                          <ClipboardList className="size-5" aria-hidden="true" />
                          Mis pedidos de ayuda
                        </Link>
                        <Link
                          to="/my-help"
                          role="menuitem"
                          className={menuItemClass}
                          onClick={() => setMenuOpen(false)}
                        >
                          <HandHeart className="size-5" aria-hidden="true" />
                          Mis ayudas
                        </Link>
                        <Link
                          to="/notifications"
                          role="menuitem"
                          className={menuItemClass}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Bell className="size-5" aria-hidden="true" />
                          Notificaciones
                          {unread > 0 ? (
                            <span className="bg-brand-600 ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold text-white">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          ) : null}
                        </Link>
                        {isAdmin ? (
                          <Link
                            to="/admin"
                            role="menuitem"
                            className={menuItemClass}
                            onClick={() => setMenuOpen(false)}
                          >
                            <ShieldCheck className="size-5" aria-hidden="true" />
                            Panel de administración
                          </Link>
                        ) : null}
                        <Link
                          to="/account"
                          role="menuitem"
                          className={menuItemClass}
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="size-5" aria-hidden="true" />
                          {String(user?.user_metadata.display_name ?? 'Mi cuenta')}
                        </Link>
                      </>
                    )}
                    <div className="border-arena-200 mt-1 flex flex-col border-t pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className={`${menuItemClass} text-closed-600 disabled:opacity-60`}
                      >
                        <LogOut className="size-5" aria-hidden="true" />
                        Salir
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <BottomNav />
    </>
  )
}
