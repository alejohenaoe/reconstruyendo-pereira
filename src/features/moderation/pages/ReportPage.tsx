import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { ReportForm } from '@/features/moderation/components/ReportForm'
import type { ReportTarget, ReportTargetType } from '@/features/moderation/types'
import { AppHeader } from '@/shared/components/AppHeader'
import { Alert } from '@/shared/components/Alert'
import { buttonStyles } from '@/shared/components/buttonStyles'
import { ArrowLeft } from 'lucide-react'

function isTargetType(value: string | null): value is ReportTargetType {
  return value === 'need' || value === 'comment' || value === 'user'
}

/** Página de reporte (MVP §26): reporta una necesidad, un comentario o un usuario. */
export function ReportPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const target = useMemo<ReportTarget | null>(() => {
    const type = params.get('type')
    const id = params.get('id')
    const label = params.get('label') ?? 'este contenido'
    if (!isTargetType(type) || !id) return null
    return { type, id, label }
  }, [params])

  const needId = params.get('needId')

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-closed-500 hover:text-brand-700 mb-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver
        </button>

        <h1 className="text-brand-900 text-xl font-semibold">Reportar</h1>
        <p className="text-closed-500 mt-1 mb-4 text-sm">
          Ayúdanos a mantener la comunidad segura. Este contenido será revisado por moderación.
        </p>

        {target ? (
          <ReportForm
            target={target}
            onDone={() => navigate(needId ? `/needs/${needId}` : '/needs', { replace: true })}
          />
        ) : (
          <div className="flex flex-col items-start gap-3">
            <Alert>No entendimos qué contenido quieres reportar.</Alert>
            <Link to="/needs" className={buttonStyles({ variant: 'secondary' })}>
              Ir a pedidos de ayuda
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
