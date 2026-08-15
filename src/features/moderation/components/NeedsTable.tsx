import { useState } from 'react'
import { Link } from 'react-router-dom'

import { moderateNeed } from '@/features/moderation/services/moderationService'
import type { AdminNeed } from '@/features/moderation/types'
import { NEED_STATUS_LABELS } from '@/features/needs/types'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

interface NeedsTableProps {
  needs: AdminNeed[]
  onChanged: () => void
}

/** Necesidades del panel admin: ocultar/restaurar y cerrar. */
export function NeedsTable({ needs, onChanged }: NeedsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(need: AdminNeed, action: 'hide' | 'unhide' | 'close') {
    if (
      action === 'hide' &&
      !window.confirm(`¿Ocultar "${need.title}"? Dejará de ser visible públicamente.`)
    ) {
      return
    }
    if (action === 'close' && !window.confirm(`¿Cerrar "${need.title}"?`)) return
    setBusyId(need.id)
    setError(null)
    const result = await moderateNeed(need.id, action)
    setBusyId(null)
    if (!result.ok) setError(result.error)
    else onChanged()
  }

  if (needs.length === 0) {
    return <p className="text-closed-500 text-sm">No hay pedidos de ayuda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-danger-600 text-sm">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {needs.map((need) => (
          <li
            key={need.id}
            className="border-closed-100 flex flex-col gap-2 rounded-md border bg-white px-3 py-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/needs/${need.id}`}
                  className="text-closed-800 hover:text-brand-700 truncate text-sm font-medium hover:underline"
                >
                  {need.title}
                </Link>
                <p className="text-closed-500 text-xs">
                  {need.owner_name} · {NEED_STATUS_LABELS[need.status]}
                  {need.is_hidden ? ' · Ocultado' : ''} · {timeAgo(need.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {need.status !== 'CLOSED' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === need.id}
                    onClick={() => void run(need, 'close')}
                  >
                    Cerrar
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant={need.is_hidden ? 'secondary' : 'subtle'}
                  loading={busyId === need.id}
                  onClick={() => void run(need, need.is_hidden ? 'unhide' : 'hide')}
                >
                  {need.is_hidden ? 'Restaurar' : 'Ocultar'}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
