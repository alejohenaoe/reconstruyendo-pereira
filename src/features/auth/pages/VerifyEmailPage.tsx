import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRedirectParam } from '@/features/auth/hooks/useRedirectParam'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { buttonStyles } from '@/shared/components/buttonStyles'

/**
 * Pantalla de verificación de correo (UX_UI_GUIDELINES.md §20).
 * Nunca se presenta el correo sin verificar como un error técnico.
 */
export function VerifyEmailPage() {
  const { status, user, resendVerification, refreshSession } = useAuth()
  const redirect = useRedirectParam()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const email = searchParams.get('email') ?? user?.email ?? ''

  const [message, setMessage] = useState<{ variant: 'info' | 'error'; text: string } | null>(null)
  const [resending, setResending] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkComplete, setCheckComplete] = useState(false)

  // Con el correo ya verificado se continúa; sin sesión NO se rebota al login:
  // quien llega aquí tras un intento de entrar rechazado no tiene sesión, y
  // expulsarlo era justo lo que hacía que el login fallara sin explicación.
  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate(redirect ?? '/', { replace: true })
  }, [status, redirect, navigate])

  // Tras "Ya verifiqué mi correo": reacciona con el estado ya refrescado.
  useEffect(() => {
    if (!checkComplete) return
    if (status === 'AUTHENTICATED') {
      navigate(redirect ?? '/', { replace: true })
      return
    }
    if (status === 'EMAIL_UNVERIFIED') {
      setMessage({
        variant: 'info',
        text: 'Todavía no vemos tu correo como verificado. Revisa el enlace que te enviamos, o reenvíalo.',
      })
    }
    setCheckComplete(false)
  }, [status, checkComplete, redirect, navigate])

  async function handleResend() {
    setResending(true)
    setMessage(null)
    try {
      const result = await resendVerification(email, redirect)
      if (!result.ok) {
        setMessage({ variant: 'error', text: result.error })
        return
      }
      setMessage({
        variant: 'info',
        text: email
          ? `Enviamos un nuevo enlace de verificación a ${email}.`
          : 'Enviamos un nuevo enlace de verificación.',
      })
    } finally {
      setResending(false)
    }
  }

  async function handleCheck() {
    setChecking(true)
    setMessage(null)
    try {
      await refreshSession()
      setCheckComplete(true)
    } finally {
      setChecking(false)
    }
  }

  const withoutSession = status === 'UNAUTHENTICATED'

  return (
    <AuthLayout title="Verifica tu correo">
      <div className="flex flex-col gap-4">
        {withoutSession ? (
          <Alert variant="warning">
            No pudimos iniciar tu sesión porque tu correo todavía no está verificado.
          </Alert>
        ) : null}
        {message ? <Alert variant={message.variant}>{message.text}</Alert> : null}
        <p className="text-closed-600 text-sm leading-relaxed">
          {email
            ? `Te enviamos un enlace de verificación a ${email}.`
            : 'Te enviamos un enlace de verificación a tu correo.'}
        </p>
        <p className="text-closed-500 text-sm leading-relaxed">
          Abre ese enlace para confirmar tu cuenta. Después podrás entrar, publicar pedidos de ayuda
          y ofrecer ayuda.
        </p>
        <div className="mt-2 flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            loading={resending}
            onClick={handleResend}
          >
            Reenviar correo
          </Button>
          {withoutSession ? (
            <Link
              to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className={`${buttonStyles({ variant: 'primary', size: 'lg' })} w-full`}
            >
              Ya verifiqué: entrar
            </Link>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              loading={checking}
              onClick={handleCheck}
            >
              Ya verifiqué mi correo
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
