import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { AuthContext } from '@/features/auth/auth-context'
import {
  getSession,
  onAuthStateChange,
  resetPassword,
  resendVerification,
  signIn as serviceSignIn,
  signOut as serviceSignOut,
  signUp as serviceSignUp,
  updatePassword as serviceUpdatePassword,
} from '@/features/auth/services/authService'
import type {
  AuthContextValue,
  AuthResult,
  AuthSignUpResult,
  AuthStatus,
  SignUpInput,
} from '@/features/auth/types'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Proveedor único de sesión (ARCHITECTURE_GUIDELINES.md §7.4).
 * Deriva el estado visible a partir de la sesión y email_confirmed_at (§8):
 * AUTH_LOADING → UNAUTHENTICATED → EMAIL_UNVERIFIED → AUTHENTICATED.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    let active = true

    getSession().then(({ session: initialSession }) => {
      if (!active) return
      setSession(initialSession)
      setInitialLoading(false)
    })

    const {
      data: { subscription },
    } = onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const status: AuthStatus = initialLoading
    ? 'AUTH_LOADING'
    : session === null
      ? 'UNAUTHENTICATED'
      : session.user.email_confirmed_at === null
        ? 'EMAIL_UNVERIFIED'
        : 'AUTHENTICATED'

  const handleSignUp = useCallback(
    (input: SignUpInput, redirectPath?: string | null): Promise<AuthResult<AuthSignUpResult>> =>
      serviceSignUp(input, redirectPath),
    [],
  )

  const handleSignIn = useCallback(
    (email: string, password: string): Promise<AuthResult> => serviceSignIn(email, password),
    [],
  )

  const handleSignOut = useCallback((): Promise<void> => serviceSignOut(), [])

  const handleResetPassword = useCallback(
    (email: string): Promise<AuthResult> => resetPassword(email),
    [],
  )

  const handleResendVerification = useCallback(
    (email: string, redirectPath?: string | null): Promise<AuthResult> =>
      resendVerification(email, redirectPath),
    [],
  )

  const handleUpdatePassword = useCallback(
    (newPassword: string): Promise<AuthResult> => serviceUpdatePassword(newPassword),
    [],
  )

  const handleRefreshSession = useCallback(async () => {
    const { session: nextSession } = await getSession()
    setSession(nextSession)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      signUp: handleSignUp,
      signIn: handleSignIn,
      signOut: handleSignOut,
      resetPassword: handleResetPassword,
      resendVerification: handleResendVerification,
      updatePassword: handleUpdatePassword,
      refreshSession: handleRefreshSession,
    }),
    [
      status,
      session,
      handleSignUp,
      handleSignIn,
      handleSignOut,
      handleResetPassword,
      handleResendVerification,
      handleUpdatePassword,
      handleRefreshSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
