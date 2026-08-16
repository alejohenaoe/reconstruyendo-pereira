import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRedirectParam } from '@/features/auth/hooks/useRedirectParam'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'

export function LoginPage() {
  const { status, signIn } = useAuth()
  const navigate = useNavigate()
  const redirect = useRedirectParam()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Cuando el correo está sin verificar no basta con el mensaje: hay que ofrecer
  // la salida (reenviar el enlace), sin sacar a la persona del formulario.
  const [needsVerification, setNeedsVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Quien ya inició sesión no debe ver el login (UX §21).
  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate(redirect ?? '/', { replace: true })
    if (status === 'EMAIL_UNVERIFIED')
      navigate(`/verify-email${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, {
        replace: true,
      })
  }, [status, redirect, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setSubmitting(true)
    try {
      const result = await signIn(email.trim(), password)
      if (!result.ok) {
        setError(result.error)
        setNeedsVerification(result.code === 'email_not_confirmed')
        return
      }
      navigate(redirect ?? '/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Inicia sesión para ayudar o pedir ayuda.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant={needsVerification ? 'warning' : 'error'}>
            {error}
            {needsVerification ? (
              <Link
                to={`/verify-email?email=${encodeURIComponent(email.trim())}${
                  redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''
                }`}
                className="mt-1 block font-medium underline"
              >
                Reenviar el enlace de verificación
              </Link>
            ) : null}
          </Alert>
        ) : null}
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Entrar
        </Button>
      </form>

      <div className="text-closed-500 mt-6 flex flex-col gap-2 text-sm">
        <p>
          ¿Olvidaste tu contraseña?{' '}
          <Link
            to={`/forgot-password${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-brand-700 font-medium hover:underline"
          >
            Recupérala
          </Link>
        </p>
        <p>
          ¿No tienes cuenta?{' '}
          <Link
            to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-brand-700 font-medium hover:underline"
          >
            Crea una
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
