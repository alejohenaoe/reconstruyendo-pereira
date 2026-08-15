import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  Bell,
  HandHeart,
  Home,
  LogIn,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { buttonStyles } from '@/shared/components/buttonStyles'

const menuItemClass =
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-closed-700 hover:bg-closed-100'

/** Cabecera global mínima (UX_UI_GUIDELINES.md §6). Refleja el estado de auth. */
export function AppHeader() {
  const { status, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = useIsAdmin(user?.id ?? null)
  const { unread, refresh } = useUnreadCount()
  const canUseNotifications = status === 'AUTHENTICATED'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
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
    <header className="border-closed-100 sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-brand-800 text-lg font-semibold">
            Reconstruyamos
          </Link>
          <Link
            to="/needs"
            className="text-closed-600 hover:text-brand-700 hidden text-sm font-medium md:inline"
          >
            Pedidos de ayuda
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={() => setMenuOpen(true)}
            className="text-closed-600 hover:text-closed-800 md:hidden"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Menú móvil: hoja inferior */}
      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-4"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-brand-900 text-base font-semibold">Menú</h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-closed-500 hover:text-closed-700"
                aria-label="Cerrar menú"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {status === 'AUTH_LOADING' ? null : status === 'UNAUTHENTICATED' ? (
              <nav className="flex flex-col gap-1" aria-label="Menú principal">
                <Link to="/" className={menuItemClass} onClick={() => setMenuOpen(false)}>
                  <Home className="size-5" aria-hidden="true" />
                  Inicio
                </Link>
                <Link to="/needs" className={menuItemClass} onClick={() => setMenuOpen(false)}>
                  <HandHeart className="size-5" aria-hidden="true" />
                  Pedidos de ayuda
                </Link>
                <div className="border-closed-100 mt-2 flex flex-col gap-2 border-t pt-3">
                  <Link
                    to="/login"
                    className={buttonStyles({ variant: 'secondary', fullWidth: true })}
                  >
                    <LogIn className="size-4" aria-hidden="true" />
                    Ingresar
                  </Link>
                  <Link
                    to="/register?redirect=/needs/new"
                    className={buttonStyles({ variant: 'primary', fullWidth: true })}
                  >
                    Pedir ayuda
                  </Link>
                </div>
              </nav>
            ) : (
              <nav className="flex flex-col gap-1" aria-label="Menú principal">
                <Link to="/" className={menuItemClass} onClick={() => setMenuOpen(false)}>
                  <Home className="size-5" aria-hidden="true" />
                  Inicio
                </Link>
                <Link to="/needs" className={menuItemClass} onClick={() => setMenuOpen(false)}>
                  <HandHeart className="size-5" aria-hidden="true" />
                  Pedidos de ayuda
                </Link>
                {status === 'EMAIL_UNVERIFIED' ? (
                  <Link
                    to="/verify-email"
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
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Plus className="size-5" aria-hidden="true" />
                      Publicar pedido de ayuda
                    </Link>
                    <Link
                      to="/notifications"
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
                        className={menuItemClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        <ShieldCheck className="size-5" aria-hidden="true" />
                        Panel de administración
                      </Link>
                    ) : null}
                    <Link
                      to="/account"
                      className={menuItemClass}
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="size-5" aria-hidden="true" />
                      {String(user?.user_metadata.display_name ?? 'Mi cuenta')}
                    </Link>
                  </>
                )}
                <div className="border-closed-100 mt-2 flex flex-col gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className={`${buttonStyles({ variant: 'subtle', fullWidth: true })} disabled:opacity-60`}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Salir
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
