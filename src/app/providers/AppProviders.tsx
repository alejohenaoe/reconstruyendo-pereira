import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '@/app/providers/AuthProvider'

/**
 * Proveedores globales de la aplicación.
 * AuthProvider centraliza el estado de sesión (ARCHITECTURE_GUIDELINES.md §7.4).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}
