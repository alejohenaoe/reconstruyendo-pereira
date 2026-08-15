import { useEffect, useState } from 'react'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRedirectParam } from '@/features/auth/hooks/useRedirectParam'
import { ButtonLink } from '@/shared/components/Button'
import { PageLoader } from '@/shared/components/PageLoader'

/**
 * Destino de los enlaces de verificación de correo.
 * Supabase deja la sesión en el fragmento de la URL (detectSessionInUrl); aquí
 * se decide a dónde continuar según el estado, preservando ?redirect (UX §21).
 */
export function AuthCallbackPage() {
  const { status, user } = useAuth()
  const redirect = useRedirectParam()
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (status === 'AUTH_LOADING') return
    if (status === 'AUTHENTICATED') {
      window.location.replace(redirect ?? '/')
      return
    }
    if (status === 'EMAIL_UNVERIFIED') {
      window.location.replace(
        `/verify-email?redirect=${redirect ? encodeURIComponent(redirect) : ''}&email=${encodeURIComponent(user?.email ?? '')}`,
      )
      return
    }
    // UNAUTHENTICATED: el token no se pudo canjear (expiró, ya se usó o es inválido).
    setExpired(true)
  }, [status, redirect, user?.email])

  if (status === 'AUTH_LOADING') {
    return <PageLoader />
  }

  if (expired) {
    return (
      <AuthLayout title="Enlace no válido">
        <div className="flex flex-col gap-4">
          <p className="text-closed-600 text-sm leading-relaxed">
            Este enlace de verificación es inválido o ya expiró. Puedes solicitar uno nuevo.
          </p>
          <ButtonLink to="/verify-email" variant="primary" size="lg" fullWidth>
            Solicitar otro enlace
          </ButtonLink>
        </div>
      </AuthLayout>
    )
  }

  return <PageLoader />
}
