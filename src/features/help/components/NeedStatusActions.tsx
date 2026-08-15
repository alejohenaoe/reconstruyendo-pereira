import { useState } from 'react'

import { CheckCircle2, CircleOff, Clock, PencilLine } from 'lucide-react'

import { updateNeedStatus } from '@/features/help/services/helpService'
import { ResolutionPanel } from '@/features/needs/components/ResolutionPanel'
import type { NeedStatus } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'

interface NeedStatusActionsProps {
  needId: string
  status: NeedStatus
  /** Actualización del cierre ya guardada, para poder editarla (MVP §23). */
  resolutionNote: string | null
  onChanged: () => void
}

/** Acciones del autor sobre el estado de su necesidad (nunca optimistas, UX §41). */
export function NeedStatusActions({
  needId,
  status,
  resolutionNote,
  onChanged,
}: NeedStatusActionsProps) {
  const [action, setAction] = useState<NeedStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Al solucionar se abre el panel de cierre en vez de cambiar el estado de
  // inmediato: es el momento natural para contar cómo quedó y agradecer.
  const [resolving, setResolving] = useState(false)
  const [editingNote, setEditingNote] = useState(false)

  async function handleChange(next: NeedStatus) {
    if (
      next === 'CLOSED' &&
      !window.confirm(
        '¿Seguro que quieres cerrar este pedido de ayuda? Ya no aceptará nuevas ofertas.',
      )
    ) {
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

        {status === 'IN_PROGRESS' && !resolving ? (
          <Button type="button" variant="secondary" onClick={() => setResolving(true)}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Marcar como solucionada
          </Button>
        ) : null}

        {status === 'RESOLVED' && !editingNote ? (
          <Button type="button" variant="secondary" onClick={() => setEditingNote(true)}>
            <PencilLine className="size-4" aria-hidden="true" />
            {resolutionNote ? 'Editar la actualización' : 'Contar cómo quedó'}
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
            Cerrar pedido de ayuda
          </Button>
        ) : null}
      </div>

      {resolving || editingNote ? (
        <ResolutionPanel
          needId={needId}
          mode={resolving ? 'resolve' : 'update'}
          initialNote={resolutionNote ?? ''}
          onDone={() => {
            setResolving(false)
            setEditingNote(false)
            onChanged()
          }}
          onCancel={() => {
            setResolving(false)
            setEditingNote(false)
          }}
        />
      ) : null}
    </div>
  )
}
