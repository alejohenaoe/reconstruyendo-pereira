import { Link } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppHeader } from '@/shared/components/AppHeader'
import { buttonStyles } from '@/shared/components/buttonStyles'

/** Página de inicio (UX_UI_GUIDELINES.md §7): entrada al listado público. */
export function HomePage() {
  const { status } = useAuth()
  const unauthenticated = status === 'UNAUTHENTICATED'

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-brand-800 text-3xl font-semibold">Reconstruyamos</h1>
        <p className="text-closed-600 max-w-md text-lg leading-relaxed">
          Ayudémonos entre todos. Conecta personas que necesitan ayuda con quienes pueden aportar trabajo, conocimientos o materiales.
        </p>
        <div className="flex w-full flex-col gap-3 sm:max-w-sm sm:flex-row">
          <Link to="/needs" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            Ver necesidades
          </Link>
          {unauthenticated ? (
            <Link to="/register?redirect=/" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
              Necesito ayuda
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  )
}
