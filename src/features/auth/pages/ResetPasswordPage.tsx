import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Alert } from '@/shared/components/Alert'
import { Button, ButtonLink } from '@/shared/components/Button'
import { PageLoader } from '@/shared/components/PageLoader'
import { TextField } from '@/shared/components/TextField'

/**
 * Página destino del enlace de restablecimiento de contraseña.
 * El token de recuperación llega en el fragmento de la URL y Supabase lo procesa
 * con detectSessionInUrl; aquí solo se cambia la contraseña.
 */
export function ResetPasswordPage() {
  const { status, updatePassword, signOut } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) {
      void signOut()
    }
  }, [done, signOut])

  if (status === 'AUTH_LOADING') {
    return <PageLoader />
  }

  if (status === 'UNAUTHENTICATED') {
    return (
      <AuthLayout title="Enlace no válido">
        <div className="flex flex-col gap-4">
          <p className="text-closed-600 text-sm leading-relaxed">
            Este enlace de recuperación es inválido o ya expiró.
          </p>
          <ButtonLink to="/forgot-password" variant="primary" size="lg" fullWidth>
            Solicitar uno nuevo
          </ButtonLink>
        </div>
      </AuthLayout>
    )
  }

  if (done) {
    return (
      <AuthLayout title="Contraseña actualizada">
        <div className="flex flex-col gap-4">
          <p className="text-closed-600 text-sm leading-relaxed">
            Tu contraseña se actualizó correctamente.
          </p>
          <ButtonLink to="/login" variant="primary" size="lg" fullWidth>
            Entrar
          </ButtonLink>
        </div>
      </AuthLayout>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSubmitting(true)
    try {
      const result = await updatePassword(password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña para tu cuenta.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <Alert>{error}</Alert> : null}
        <TextField
          label="Nueva contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 6 caracteres."
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Repite la contraseña"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Guardar contraseña
        </Button>
      </form>
      <p className="text-closed-500 mt-6 text-sm">
        <Link to="/login" className="text-brand-700 font-medium hover:underline">
          Volver a Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
