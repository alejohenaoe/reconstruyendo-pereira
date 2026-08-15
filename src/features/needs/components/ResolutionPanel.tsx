import { useState } from 'react'

import { CheckCircle2 } from 'lucide-react'

import { ImagePicker } from '@/features/needs/components/ImagePicker'
import type { ImageUploadState, PickedImage } from '@/features/needs/components/ImagePicker'
import { uploadNeedImage } from '@/features/needs/services/needPublishService'
import { saveResolutionNote, updateNeedStatus } from '@/features/help/services/helpService'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { MAX_ORIGINAL_IMAGE_BYTES } from '@/shared/utils/imageCompress'

const MAX_AFTER_PHOTOS = 3

const textareaClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-arena-100 disabled:opacity-60 resize-y'

interface ResolutionPanelProps {
  needId: string
  /** `resolve` además marca el pedido como solucionado; `update` solo guarda. */
  mode: 'resolve' | 'update'
  initialNote: string
  onDone: () => void
  onCancel?: () => void
}

/**
 * Cierre de un pedido de ayuda (MVP §23): contar cómo quedó, agradecer a quien
 * ayudó y subir fotos posteriores. Todo es opcional; lo único obligatorio al
 * resolver es el cambio de estado.
 */
export function ResolutionPanel({
  needId,
  mode,
  initialNote,
  onDone,
  onCancel,
}: ResolutionPanelProps) {
  const [note, setNote] = useState(initialNote)
  const [images, setImages] = useState<PickedImage[]>([])
  const [uploadState, setUploadState] = useState<Record<string, ImageUploadState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  function handleAddFiles(files: File[]) {
    setAddError(null)
    const slots = MAX_AFTER_PHOTOS - images.length
    if (files.length > slots) {
      setAddError(`Puedes añadir hasta ${MAX_AFTER_PHOTOS} fotos del resultado.`)
      files = files.slice(0, slots)
    }
    if (files.some((file) => file.size > MAX_ORIGINAL_IMAGE_BYTES)) {
      setAddError(
        'Una de las fotos es muy pesada para procesarla aquí; prueba con una más liviana.',
      )
      return
    }
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setAddError('Solo se admiten archivos de imagen.')
      return
    }
    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ])
  }

  function handleRemoveImage(id: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((image) => image.id !== id)
    })
  }

  async function handleSubmit() {
    const trimmed = note.trim()
    if (trimmed.length === 1) {
      setError('La actualización debe tener al menos 2 caracteres.')
      return
    }
    setSubmitting(true)
    setError(null)

    // Primero las fotos: si algo falla, el pedido no queda marcado como
    // solucionado con fotos a medias y la persona puede reintentar.
    for (const image of images) {
      setUploadState((current) => ({ ...current, [image.id]: 'uploading' }))
      const result = await uploadNeedImage(needId, image.file, false, 'AFTER')
      setUploadState((current) => ({ ...current, [image.id]: result.ok ? 'done' : 'error' }))
      if (!result.ok) {
        setSubmitting(false)
        setError(result.error)
        return
      }
    }

    const note_ = trimmed.length > 0 ? trimmed : null
    const result =
      mode === 'resolve'
        ? await updateNeedStatus(needId, 'RESOLVED', note_)
        : await saveResolutionNote(needId, note_)

    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setImages([])
    setUploadState({})
    onDone()
  }

  return (
    <div className="border-arena-200 bg-arena-50 flex flex-col gap-4 rounded-lg border p-4">
      {error ? <Alert>{error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resolution-note" className="text-closed-700 text-sm font-medium">
          ¿Cómo quedó? (opcional)
        </label>
        <p className="text-closed-500 text-xs">
          Cuenta cómo terminó y agradece a quienes te ayudaron. Lo verá toda la comunidad.
        </p>
        <textarea
          id="resolution-note"
          name="resolution-note"
          rows={4}
          value={note}
          maxLength={2000}
          disabled={submitting}
          placeholder="Ej. Ya quedó el techo. Gracias a Juan y a Jorge, que trajeron el cemento."
          className={textareaClass}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-closed-700 text-sm font-medium">Fotos del resultado (opcional)</span>
        <ImagePicker
          images={images}
          max={MAX_AFTER_PHOTOS}
          uploadState={uploadState}
          onAddFiles={handleAddFiles}
          onRemove={handleRemoveImage}
          addError={addError}
          disabled={submitting}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" loading={submitting} onClick={() => void handleSubmit()}>
          <CheckCircle2 className="size-4" aria-hidden="true" />
          {mode === 'resolve' ? 'Marcar como solucionada' : 'Guardar actualización'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="subtle" disabled={submitting} onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
