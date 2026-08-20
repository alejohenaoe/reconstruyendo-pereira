import type { AuthError, SupabaseClient } from '@supabase/supabase-js'

import type {
  AuthErrorCode,
  AuthResult,
  AuthSignUpResult,
  Municipality,
  SignUpInput,
} from '@/features/auth/types'
import { supabase } from '@/shared/lib/supabase'

/** Ruta que procesa la sesión devuelta por los enlaces de correo (confirmación y reset). */
const AUTH_CALLBACK_PATH = '/auth/callback'

function emailRedirectTo(path: string): string {
  return `${window.location.origin}${path}`
}

/** URL del enlace de verificación, conservando la intención original (?redirect=, UX §21). */
function verificationRedirectTo(redirectPath: string | null | undefined): string {
  const search = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''
  return emailRedirectTo(`${AUTH_CALLBACK_PATH}${search}`)
}

/** Traduce un error de Supabase a un mensaje humano + código para la UI (UX §25). */
export function mapAuthError(error: AuthError): { message: string; code: AuthErrorCode } {
  const code = error.code
  const message = error.message ?? ''
  const m = message.toLowerCase()

  if (
    code === 'user_already_exists' ||
    m.includes('already registered') ||
    m.includes('already been registered')
  ) {
    return { message: 'Ya existe una cuenta con este correo.', code: 'user_already_exists' }
  }
  if (code === 'over_email_send_rate_limit' || m.includes('rate limit')) {
    return {
      message:
        'Enviamos demasiados correos a esta dirección. Espera un momento e inténtalo de nuevo.',
      code: 'rate_limited',
    }
  }
  if (m.includes('invalid login credentials')) {
    return { message: 'Correo o contraseña incorrectos.', code: 'invalid_credentials' }
  }
  if (m.includes('email not confirmed')) {
    return {
      message: 'Todavía no confirmas tu correo. Revisa tu bandeja de entrada.',
      code: 'email_not_confirmed',
    }
  }
  if (
    m.includes('password should be at least') ||
    m.includes('password must be at least') ||
    m.includes('weak password')
  ) {
    return { message: 'La contraseña debe tener al menos 6 caracteres.', code: 'weak_password' }
  }
  if (m.includes('signup') && m.includes('disabled')) {
    return { message: 'El registro está deshabilitado por el momento.', code: 'signups_disabled' }
  }
  if (m.includes('no user found') || m.includes('user not found')) {
    return { message: 'No encontramos una cuenta con este correo.', code: 'user_not_found' }
  }
  if (m.includes('invalid otp') || m.includes('invalid token')) {
    return {
      message: 'Este enlace es inválido o ya expiró. Solicita uno nuevo.',
      code: 'invalid_token',
    }
  }
  if (m.includes('new password should be different')) {
    return {
      message: 'La nueva contraseña debe ser diferente de la anterior.',
      code: 'same_password',
    }
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return {
      message: 'No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      code: 'network',
    }
  }
  return { message: 'Ocurrió un problema con tu cuenta. Inténtalo de nuevo.', code: 'unknown' }
}

export async function getMunicipalities(): Promise<AuthResult<Municipality[]>> {
  const { data, error } = await supabase
    .from('municipalities')
    .select('id, slug, name')
    .order('name')
  if (error)
    return { ok: false, data: null, error: 'No pudimos cargar los municipios.', code: 'unknown' }
  return { ok: true, data: data as Municipality[], error: null, code: null }
}

export async function signUp(
  input: SignUpInput,
  redirectPath?: string | null,
): Promise<AuthResult<AuthSignUpResult>> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        municipality: input.municipalitySlug,
        capabilities: input.capabilitySlugs,
      },
      emailRedirectTo: verificationRedirectTo(redirectPath),
    },
  })
  if (error) {
    const mapped = mapAuthError(error)
    return { ok: false, data: null, error: mapped.message, code: mapped.code }
  }
  // Con el alta autoconfirmada (ARCHITECTURE_GUIDELINES.md §7.2.1) signUp devuelve sesión y esto
  // es false: se entra directo. Si la confirmación se reactiva, no hay sesión y hay que verificar.
  return {
    ok: true,
    data: { needsEmailConfirmation: data.session === null },
    error: null,
    code: null,
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const mapped = mapAuthError(error)
    return { ok: false, data: null, error: mapped.message, code: mapped.code }
  }
  return { ok: true, data: undefined, error: null, code: null }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: emailRedirectTo('/reset-password'),
  })
  if (error) {
    const mapped = mapAuthError(error)
    return { ok: false, data: null, error: mapped.message, code: mapped.code }
  }
  return { ok: true, data: undefined, error: null, code: null }
}

export async function resendVerification(
  email: string,
  redirectPath?: string | null,
): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: verificationRedirectTo(redirectPath) },
  })
  if (error) {
    const mapped = mapAuthError(error)
    return { ok: false, data: null, error: mapped.message, code: mapped.code }
  }
  return { ok: true, data: undefined, error: null, code: null }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    const mapped = mapAuthError(error)
    return { ok: false, data: null, error: mapped.message, code: mapped.code }
  }
  return { ok: true, data: undefined, error: null, code: null }
}

export async function getSession(): Promise<{
  session: Awaited<ReturnType<SupabaseClient['auth']['getSession']>>['data']['session']
}> {
  const { data } = await supabase.auth.getSession()
  return { session: data.session }
}

export function onAuthStateChange(
  listener: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0],
) {
  return supabase.auth.onAuthStateChange(listener)
}
