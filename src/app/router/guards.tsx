import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useIsAdmin } from '@/features/auth/hooks/useIsAdmin'
import { PageLoader } from '@/shared/components/PageLoader'

function redirectTarget(pathname: string, search: string): string {
  const current = encodeURIComponent(pathname + search)
  return `/login?redirect=${current}`
}

function unverifiedTarget(pathname: string, search: string): string {
  const current = encodeURIComponent(pathname + search)
  return `/verify-email?redirect=${current}`
}

/**
 * Los guards existen para UX/navegación y NO sustituyen la seguridad del backend
 * (ARCHITECTURE_GUIDELINES.md §9), que se valida siempre en Supabase vía RLS.
 */

/** Requiere sesión iniciada. */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'AUTH_LOADING') return <PageLoader />
  if (status === 'UNAUTHENTICATED') {
    return <Navigate to={redirectTarget(location.pathname, location.search)} replace />
  }
  return <Outlet />
}

/** Requiere sesión iniciada y correo verificado. */
export function VerifiedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'AUTH_LOADING') return <PageLoader />
  if (status === 'UNAUTHENTICATED') {
    return <Navigate to={redirectTarget(location.pathname, location.search)} replace />
  }
  if (status === 'EMAIL_UNVERIFIED') {
    return <Navigate to={unverifiedTarget(location.pathname, location.search)} replace />
  }
  return <Outlet />
}

/** Rol administrativo, consultado en profiles (ARCHITECTURE_GUIDELINES.md §36). */
export function AdminRoute() {
  const { status, user } = useAuth()
  const location = useLocation()
  const isAdmin = useIsAdmin(user?.id ?? null)

  if (status === 'AUTH_LOADING') return <PageLoader />
  if (status === 'UNAUTHENTICATED') {
    return <Navigate to={redirectTarget(location.pathname, location.search)} replace />
  }
  if (status === 'EMAIL_UNVERIFIED') {
    return <Navigate to={unverifiedTarget(location.pathname, location.search)} replace />
  }
  if (isAdmin === null) return <PageLoader />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
