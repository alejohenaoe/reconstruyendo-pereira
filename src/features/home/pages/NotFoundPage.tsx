import { Link } from 'react-router-dom'

import { AppHeader } from '@/shared/components/AppHeader'
import { buttonStyles } from '@/shared/components/buttonStyles'

export function NotFoundPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-closed-500 text-sm font-medium uppercase">Error 404</p>
        <h1 className="text-brand-900 text-2xl font-semibold">No encontramos esta página</h1>
        <Link to="/" className={buttonStyles({ variant: 'primary', size: 'md' })}>
          Volver al inicio
        </Link>
      </main>
    </div>
  )
}
