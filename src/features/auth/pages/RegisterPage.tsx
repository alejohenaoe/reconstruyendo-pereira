import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMunicipalities } from '@/features/auth/hooks/useMunicipalities'
import { useRedirectParam } from '@/features/auth/hooks/useRedirectParam'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'

export function RegisterPage() {
  const { status, signUp } = useAuth()
  const navigate = useNavigate()
  const redirect = useRedirectParam()
  const { municipalities, loading: loadingMunicipalities, error: municipalitiesError } = useMunicipalities()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [municipalitySlug, setMunicipalitySlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate(redirect ?? '/', { replace: true })
    if (status === 'EMAIL_UNVERIFIED') navigate(`/verify-email${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`, { replace: true })
  }, [status, redirect, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const trimmedName = displayName.trim()
    const trimmedEmail = email.trim()
    if (trimmedName.length < 2) {
      setError('Escribe tu nombre.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (!municipalitySlug) {
      setError('Selecciona tu municipio.')
      return
    }

    setSubmitting(true)
    try {
      const result = await signUp(
        {
          displayName: trimmedName,
          email: trimmedEmail,
          password,
          municipalitySlug,
        },
        redirect,
      )
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.data.needsEmailConfirmation) {
        navigate(
          `/verify-email?redirect=${redirect ? encodeURIComponent(redirect) : ''}&email=${encodeURIComponent(trimmedEmail)}`,
          { replace: true },
        )
        return
      }
      navigate(redirect ?? '/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Crear cuenta" subtitle="Regístrate en un momento: nombre, correo y municipio.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <Alert>{error}</Alert> : null}
        {municipalitiesError ? <Alert>{municipalitiesError}</Alert> : null}
        <TextField
          label="Nombre"
          name="displayName"
          autoComplete="name"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
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
          autoComplete="new-password"
          hint="Mínimo 6 caracteres."
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="municipality" className="text-closed-700 text-sm font-medium">
            Municipio
          </label>
          <select
            id="municipality"
            name="municipality"
            required
            value={municipalitySlug}
            onChange={(event) => setMunicipalitySlug(event.target.value)}
            disabled={loadingMunicipalities}
            className="text-closed-700 focus:border-brand-500 focus:ring-brand-500 w-full rounded-md border border-closed-100 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-closed-100 disabled:opacity-60"
          >
            <option value="">Selecciona tu municipio</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.slug}>
                {municipality.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Crear cuenta
        </Button>
      </form>

      <p className="text-closed-500 mt-6 text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link
          to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className="text-brand-700 font-medium hover:underline"
        >
          Entra
        </Link>
      </p>
    </AuthLayout>
  )
}
