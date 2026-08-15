import { useState } from 'react'
import type { FormEvent } from 'react'

import { Lock } from 'lucide-react'

import type { Municipality } from '@/features/auth/types'
import { ImagePicker } from '@/features/needs/components/ImagePicker'
import type { ImageUploadState, PickedImage } from '@/features/needs/components/ImagePicker'
import type { NeedCategory } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { TextField } from '@/shared/components/TextField'
import { MAX_ORIGINAL_IMAGE_BYTES } from '@/shared/utils/imageCompress'

export interface NeedFormValues {
  title: string
  description: string
  categoryId: number
  municipalityId: number
  neighborhood: string | null
  needsAssessment: boolean
  address: string | null
}

const MAX_PHOTOS = 5

const selectClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-arena-100 disabled:opacity-60'
const textareaClass = `${selectClass} resize-y`

interface NeedFormProps {
  municipalities: Municipality[]
  categories: NeedCategory[]
  uploadState: Record<string, ImageUploadState>
  submitting: boolean
  globalError: string | null
  onSubmit: (values: NeedFormValues, images: PickedImage[]) => Promise<void>
}

/** Formulario de publicación de necesidad (Fase 4). */
export function NeedForm({
  municipalities,
  categories,
  uploadState,
  submitting,
  globalError,
  onSubmit,
}: NeedFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const [neighborhood, setNeighborhood] = useState('')
  const [needsAssessment, setNeedsAssessment] = useState(false)
  const [address, setAddress] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [addError, setAddError] = useState<string | null>(null)

  function handleAddFiles(files: File[]) {
    setAddError(null)
    const slots = MAX_PHOTOS - images.length
    if (files.length > slots) {
      setAddError(`Máximo ${MAX_PHOTOS} fotos por pedido de ayuda.`)
      files = files.slice(0, slots)
    }
    const tooHeavy = files.find((file) => file.size > MAX_ORIGINAL_IMAGE_BYTES)
    if (tooHeavy) {
      setAddError(
        'Una de las fotos es muy pesada para procesarla aquí; prueba con una más liviana.',
      )
      return
    }
    const notImage = files.find((file) => !file.type.startsWith('image/'))
    if (notImage) {
      setAddError('Solo se admiten archivos de imagen.')
      return
    }
    const added = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...added])
  }

  function handleRemoveImage(id: string) {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((image) => image.id !== id)
    })
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (trimmedTitle.length < 5 || trimmedTitle.length > 120) {
      errors.title = 'El título debe tener entre 5 y 120 caracteres.'
    }
    if (trimmedDescription.length < 20 || trimmedDescription.length > 4000) {
      errors.description = 'La descripción debe tener al menos 20 caracteres.'
    }
    if (categoryId === null) errors.category = 'Selecciona la categoría.'
    if (municipalityId === null) errors.municipality = 'Selecciona el municipio.'
    if (neighborhood.trim().length > 120) {
      errors.neighborhood = 'La zona o barrio debe tener menos de 120 caracteres.'
    }
    const trimmedAddress = address.trim()
    if (trimmedAddress && (trimmedAddress.length < 5 || trimmedAddress.length > 300)) {
      errors.address = 'La dirección debe tener entre 5 y 300 caracteres.'
    }
    return errors
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    await onSubmit(
      {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId as number,
        municipalityId: municipalityId as number,
        neighborhood: neighborhood.trim() || null,
        needsAssessment,
        address: address.trim() || null,
      },
      images,
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5" noValidate>
      {globalError ? <Alert>{globalError}</Alert> : null}

      <TextField
        label="Título"
        name="title"
        placeholder="¿Qué necesitas?"
        required
        value={title}
        error={fieldErrors.title}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-closed-700 text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          value={description}
          maxLength={4000}
          placeholder="Cuenta qué pasó, qué necesitas y en qué puede ayudar alguien."
          aria-invalid={fieldErrors.description ? true : undefined}
          className={`${textareaClass} ${fieldErrors.description ? 'border-danger-500' : 'border-closed-100'}`}
          onChange={(event) => setDescription(event.target.value)}
        />
        {fieldErrors.description ? (
          <p className="text-danger-600 text-xs">{fieldErrors.description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-closed-700 text-sm font-medium">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            required
            value={categoryId ?? ''}
            className={selectClass}
            onChange={(event) =>
              setCategoryId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Selecciona la categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label_es}
              </option>
            ))}
          </select>
          {fieldErrors.category ? (
            <p className="text-danger-600 text-xs">{fieldErrors.category}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="municipality" className="text-closed-700 text-sm font-medium">
            Municipio
          </label>
          <select
            id="municipality"
            name="municipality"
            required
            value={municipalityId ?? ''}
            className={selectClass}
            onChange={(event) =>
              setMunicipalityId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Selecciona el municipio</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
          {fieldErrors.municipality ? (
            <p className="text-danger-600 text-xs">{fieldErrors.municipality}</p>
          ) : null}
        </div>
      </div>

      <TextField
        label="Zona o barrio"
        name="neighborhood"
        placeholder="Opcional (ej. Villa Santana)"
        value={neighborhood}
        error={fieldErrors.neighborhood}
        maxLength={120}
        onChange={(event) => setNeighborhood(event.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="needs_assessment"
            checked={needsAssessment}
            className="text-brand-600 border-closed-100 focus:ring-brand-500 mt-0.5 size-4 shrink-0 rounded"
            onChange={(event) => setNeedsAssessment(event.target.checked)}
          />
          <span>
            <span className="text-closed-800 font-medium">No sé exactamente qué necesito</span>
            <span className="text-closed-500 block text-xs">
              Se mostrará un aviso en tu publicación para que alguien pueda evaluar el alcance.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-closed-700 text-sm font-medium">Fotografías</span>
        <ImagePicker
          images={images}
          max={MAX_PHOTOS}
          uploadState={uploadState}
          onAddFiles={handleAddFiles}
          onRemove={handleRemoveImage}
          addError={addError}
          disabled={submitting}
        />
      </div>

      <div className="border-info-100 bg-info-50 rounded-lg border p-4">
        <p className="text-info-700 flex items-center gap-1.5 text-sm font-medium">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Dirección exacta (opcional)
        </p>
        <p className="text-info-700 mt-1 text-xs leading-relaxed">
          Es privada: solo la verás tú y, cuando haya ofertas, las personas que se ofrezcan a
          ayudarte. Nunca aparece en el listado público.
        </p>
        <div className="mt-3">
          <TextField
            label="Dirección"
            name="address"
            placeholder="Opcional"
            value={address}
            error={fieldErrors.address}
            maxLength={300}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" loading={submitting}>
        {submitting ? 'Publicando…' : 'Publicar pedido de ayuda'}
      </Button>
    </form>
  )
}
