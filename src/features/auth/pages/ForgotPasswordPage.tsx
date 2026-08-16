import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useRedirectParam } from '@/features/auth/hooks/useRedirectParam'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const redirect = useRedirectParam()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await resetPassword(email.trim())
      if (!result.ok) {
        setError(result.error)
        return
      }
      // No se revela si la cuenta existe (evita enumeración de cuentas).
      setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Revisa tu correo">
        <div className="flex flex-col gap-4">
          <p className="text-closed-600 text-sm leading-relaxed">
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
            contraseña.
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => window.location.reload()}
          >
            Volver
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace para restablecerla.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <Alert>{error}</Alert> : null}
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Enviar enlace
        </Button>
      </form>
      <p className="text-closed-500 mt-6 text-sm">
        <Link
          to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className="text-brand-700 font-medium hover:underline"
        >
          Volver a Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
