import { createContext } from 'react'

import type { AuthContextValue } from '@/features/auth/types'

/**
 * Contexto global de autenticación. El proveedor vive en app/providers/AuthProvider
 * y el consumo público es el hook useAuth (ARCHITECTURE_GUIDELINES.md §7.5).
 */
export const AuthContext = createContext<AuthContextValue | null>(null)
