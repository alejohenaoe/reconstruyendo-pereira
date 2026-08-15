import { useContext } from 'react'

import { AuthContext } from '@/features/auth/auth-context'
import type { AuthContextValue } from '@/features/auth/types'

/** Única interfaz para consumir el estado de autenticación (ARCHITECTURE_GUIDELINES.md §7.5). */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>.')
  }
  return context
}
