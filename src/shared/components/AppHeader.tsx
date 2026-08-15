import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { useUnreadCount } from '@/features/notifications/hooks/useNotifications'
import { buttonStyles } from '@/shared/components/buttonStyles'

/**
 * Cabecera global mínima (UX_UI_GUIDELINES.md §6).
 * Refleja el estado de auth: acciones de entrada o identidad del usuario.
 */
export function AppHeader() {
  const { status, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const isAdmin = useIsAdmin(user?.id ?? null)
  const { unread, refresh } = useUnreadCount()
  const canUseNotifications = status === 'AUTHENTICATED'

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="border-closed-100 sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-brand-800 text-lg font-semibold">
            Reconstruyamos
          </Link>
          <Link to="/needs" className="text-closed-600 hover:text-brand-700 text-sm font-medium">
            Necesidades
          </Link>
        </div>

        {status === 'AUTH_LOADING' ? null : status === 'UNAUTHENTICATED' ? (
          <nav className="flex items-center gap-2" aria-label="Acceso">
            <Link to="/login" className={buttonStyles({ variant: 'subtle', size: 'md' })}>
              Entrar
            </Link>
            <Link to="/register" className={buttonStyles({ variant: 'primary', size: 'md' })}>
              Crear cuenta
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-3" aria-label="Tu cuenta">
            {status === 'EMAIL_UNVERIFIED' ? (
              <Link to="/verify-email" className="text-warning-600 text-sm font-medium hover:underline">
                Verificar correo
              </Link>
            ) : (
              <>
                <Link to="/needs/new" className={buttonStyles({ variant: 'secondary', size: 'md' })}>
                  Publicar
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className="text-brand-700 text-sm font-medium hover:underline">
                    Admin
                  </Link>
                ) : null}
                {canUseNotifications ? (
                  <Link
                    to="/notifications"
                    onClick={() => void refresh()}
                    aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
                    className="text-closed-600 hover:text-brand-700 relative text-sm font-medium"
                  >
                    Notificaciones
                    {unread > 0 ? (
                      <span className="bg-brand-600 text-white absolute -top-1.5 -right-2.5 rounded-full px-1.5 py-px text-[10px] font-semibold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </Link>
                ) : null}
                <Link to="/account" className="text-closed-600 hover:text-brand-700 text-sm font-medium">
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
          </nav>
        )}
      </div>
    </header>
  )
}
