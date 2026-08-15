import { useState } from 'react'
import type { FormEvent } from 'react'

import { ShieldAlert } from 'lucide-react'

import { createReport } from '@/features/moderation/services/moderationService'
import type { ReportReason, ReportTarget } from '@/features/moderation/types'
import { REPORT_REASONS, REPORT_REASON_LABELS } from '@/features/moderation/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { buttonStyles } from '@/shared/components/buttonStyles'
import { Link } from 'react-router-dom'

const radioClass =
  'border-arena-200 flex cursor-pointer items-start gap-2 rounded-md border bg-white px-3 py-2 text-sm text-closed-700 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50'
const textareaClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-y'

interface ReportFormProps {
  target: ReportTarget
  /** Qué mostramos al usuario antes de reportar (ej. "el comentario de …"). */
  onDone: () => void
}

/** Formulario de reporte (MVP §26). Solo verificado y no suspendido puede reportar (RLS). */
export function ReportForm({ target, onDone }: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (reason === null) {
      setError('Elige el motivo del reporte.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await createReport(target, reason, details)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert variant="success">Gracias. Tu reporte quedó registrado y un moderador lo revisará.</Alert>
        <button type="button" onClick={onDone} className={buttonStyles({ variant: 'secondary' })}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <div className="border-arena-200 flex items-start gap-3 rounded-lg border bg-white p-4 shadow-sm">
        <ShieldAlert className="text-brand-600 mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-closed-800 text-sm font-medium">Estás reportando: {target.label}</p>
          <p className="text-closed-500 mt-1 text-sm">
            Los reportes son confidenciales y los revisa el equipo de moderación.
          </p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-closed-700 mb-1 text-sm font-medium">Motivo</legend>
        {REPORT_REASONS.map((option) => (
          <label key={option} className={radioClass}>
            <input
              type="radio"
              name="reason"
              value={option}
              checked={reason === option}
              onChange={() => setReason(option)}
              className="mt-0.5 accent-brand-600"
            />
            <span>{REPORT_REASON_LABELS[option]}</span>
          </label>
        ))}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-closed-700 text-sm font-medium">Detalles (opcional)</span>
        <textarea
          name="details"
          rows={4}
          maxLength={1000}
          placeholder="Cuenta brevemente qué está pasando (máximo 1000 caracteres)."
          className={textareaClass}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
        <span className="text-closed-400 text-xs text-right">{details.length}/1000</span>
      </label>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting}>
          {submitting ? 'Enviando…' : 'Enviar reporte'}
        </Button>
        <Link to="/needs" className={buttonStyles({ variant: 'subtle' })}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
