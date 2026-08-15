import type { Session, User } from '@supabase/supabase-js'

/** Estados derivados de la sesión (ARCHITECTURE_GUIDELINES.md §8). */
export type AuthStatus = 'AUTH_LOADING' | 'UNAUTHENTICATED' | 'EMAIL_UNVERIFIED' | 'AUTHENTICATED'

export interface SignUpInput {
  displayName: string
  email: string
  password: string
  /** Slug del municipio (ej. `pereira`); el trigger handle_new_user lo resuelve. */
  municipalitySlug: string | null
  /**
   * Slugs de las capacidades declaradas (tipo de participación, MVP §19). Viajan
   * en la metadata porque con la confirmación de correo activa todavía no hay
   * sesión para escribir en `profile_capabilities`: las materializa el trigger.
   */
  capabilitySlugs: string[]
}

/** Códigos legibles por máquina para que la UI reaccione sin depender de strings. */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'rate_limited'
  | 'weak_password'
  | 'signups_disabled'
  | 'invalid_token'
  | 'user_not_found'
  | 'same_password'
  | 'network'
  | 'unknown'

/**
 * Resultado de una operación de auth. `error` ya viene traducido a lenguaje
 * humano (UX_UI_GUIDELINES.md §25); `code` permite reaccionar en la UI.
 * `ok` es discriminante literal para que TS pueda estrechar el union.
 */
export type AuthResult<T = undefined> =
  | { ok: true; data: T; error: null; code: null }
  | { ok: false; data: null; error: string; code: AuthErrorCode }

export interface AuthSignUpResult {
  /** true cuando el flujo deja al usuario pendiente de confirmar el correo. */
  needsEmailConfirmation: boolean
}

export interface Municipality {
  id: number
  slug: string
  name: string
}

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  session: Session | null
  signUp: (input: SignUpInput, redirectPath?: string | null) => Promise<AuthResult<AuthSignUpResult>>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  resendVerification: (email: string, redirectPath?: string | null) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
  /** Refresca la sesión desde Supabase (se usa al volver de verificar el correo). */
  refreshSession: () => Promise<void>
}
