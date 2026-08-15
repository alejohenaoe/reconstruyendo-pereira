import { useState } from 'react'

import { CheckCircle2, CircleOff, Clock } from 'lucide-react'

import { updateNeedStatus } from '@/features/help/services/helpService'
import type { NeedStatus } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'

interface NeedStatusActionsProps {
  needId: string
  status: NeedStatus
  onChanged: () => void
}

/** Acciones del autor sobre el estado de su necesidad (nunca optimistas, UX §41). */
export function NeedStatusActions({ needId, status, onChanged }: NeedStatusActionsProps) {
  const [action, setAction] = useState<NeedStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(next: NeedStatus) {
    if (next === 'CLOSED' && !window.confirm('¿Seguro que quieres cerrar esta necesidad? Ya no aceptará nuevas ofertas.')) {
      return
    }
    setAction(next)
    setError(null)
    const result = await updateNeedStatus(needId, next)
    setAction(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onChanged()
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {status === 'OPEN' ? (
          <Button
            type="button"
            variant="secondary"
            loading={action === 'IN_PROGRESS'}
            onClick={() => void handleChange('IN_PROGRESS')}
          >
            <Clock className="size-4" aria-hidden="true" />
            Marcar en proceso
          </Button>
        ) : null}

        {status === 'IN_PROGRESS' ? (
          <Button
            type="button"
            variant="secondary"
            loading={action === 'RESOLVED'}
            onClick={() => void handleChange('RESOLVED')}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Marcar como solucionada
          </Button>
        ) : null}

        {status !== 'CLOSED' ? (
          <Button
            type="button"
            variant="subtle"
            loading={action === 'CLOSED'}
            onClick={() => void handleChange('CLOSED')}
          >
            <CircleOff className="size-4" aria-hidden="true" />
            Cerrar necesidad
          </Button>
        ) : null}
      </div>
    </div>
  )
}
