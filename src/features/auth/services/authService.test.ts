import type { AuthError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { mapAuthError } from '@/features/auth/services/authService'

function authError(code: string | undefined, message: string): AuthError {
  return { code, message } as AuthError
}

describe('mapAuthError', () => {
  it('detecta correo ya registrado', () => {
    expect(mapAuthError(authError('user_already_exists', '')).message).toContain(
      'Ya existe una cuenta',
    )
    expect(mapAuthError(authError('', 'User already registered')).message).toContain(
      'Ya existe una cuenta',
    )
  })

  it('detecta credenciales inválidas', () => {
    expect(mapAuthError(authError('', 'Invalid login credentials')).message).toBe(
      'Correo o contraseña incorrectos.',
    )
  })

  it('detecta correo sin confirmar', () => {
    expect(mapAuthError(authError('', 'Email not confirmed')).message).toContain('confirma')
  })

  it('detecta contraseña débil', () => {
    expect(
      mapAuthError(authError('', 'Password should be at least 6 characters')).message,
    ).toContain('6 caracteres')
    expect(mapAuthError(authError('', 'Weak password')).message).toContain('6 caracteres')
  })

  it('detecta límite de correos', () => {
    expect(mapAuthError(authError('over_email_send_rate_limit', '')).code).toBe('rate_limited')
    expect(mapAuthError(authError('', 'Request rate limit reached')).code).toBe('rate_limited')
  })

  it('detecta token inválido o expirado', () => {
    expect(mapAuthError(authError('', 'Invalid token')).message).toContain('expiró')
  })

  it('detecta errores de red', () => {
    expect(mapAuthError(authError('', 'Failed to fetch')).code).toBe('network')
    expect(mapAuthError(authError('', 'Network request failed')).message).toContain('conexión')
  })

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(mapAuthError(authError(undefined, 'Something else')).code).toBe('unknown')
    expect(mapAuthError(authError(undefined, 'Something else')).message).toContain(
      'Inténtalo de nuevo',
    )
  })
})
