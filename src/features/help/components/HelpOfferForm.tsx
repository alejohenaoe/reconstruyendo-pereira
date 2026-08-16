import { useState } from 'react'
import type { FormEvent } from 'react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Capability } from '@/features/help/types'
import { createHelpOffer } from '@/features/help/services/helpService'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'

const selectClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-arena-100 disabled:opacity-60'
const textareaClass = `${selectClass} resize-y`

interface HelpOfferFormProps {
  needId: string
  capabilities: Capability[]
  onOffered: () => void
}

/** Formulario de oferta de ayuda (tipo de capacidad + mensaje breve). */
export function HelpOfferForm({ needId, capabilities, onOffered }: HelpOfferFormProps) {
  const { user } = useAuth()
  const [capabilityId, setCapabilityId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (capabilityId === null) {
      setError('Selecciona el tipo de ayuda que puedes ofrecer.')
      return
    }
    const trimmed = message.trim()
    if (trimmed.length < 5 || trimmed.length > 1000) {
      setError('Cuéntanos en qué puedes ayudar (entre 5 y 1000 caracteres).')
      return
    }

    if (!user) {
      setError('Inicia sesión para ofrecer tu ayuda.')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await createHelpOffer(needId, user.id, capabilityId, trimmed)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setCapabilityId(null)
    setMessage('')
    onOffered()
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="border-brand-200 bg-brand-50 rounded-lg border p-4"
    >
      <p className="text-brand-800 font-medium">¿Cómo puedes ayudar?</p>
      <p className="text-brand-700 mt-1 text-sm">
        Tu oferta será visible para el autor y la comunidad. Solo se contactará contigo si hay
        relación de ayuda.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <select
          name="capability"
          value={capabilityId ?? ''}
          className={selectClass}
          onChange={(event) =>
            setCapabilityId(event.target.value ? Number(event.target.value) : null)
          }
        >
          <option value="">Tipo de ayuda</option>
          {capabilities.map((capability) => (
            <option key={capability.id} value={capability.id}>
              {capability.label_es}
            </option>
          ))}
        </select>

        <textarea
          name="message"
          rows={3}
          required
          maxLength={1000}
          placeholder="Cuenta brevemente en qué puedes ayudar (ej. puedo aportar 2 bultos de cemento)."
          className={textareaClass}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        {error ? <Alert>{error}</Alert> : null}

        <Button type="submit" loading={submitting}>
          {submitting ? 'Ofertando…' : 'Ofrecer ayuda'}
        </Button>
      </div>
    </form>
  )
}
