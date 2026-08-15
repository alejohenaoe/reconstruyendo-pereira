import type { ChangeEvent } from 'react'

import { ImagePlus, Loader2, Trash2, TriangleAlert } from 'lucide-react'

import { Alert } from '@/shared/components/Alert'

export interface PickedImage {
  id: string
  file: File
  previewUrl: string
}

export type ImageUploadState = 'uploading' | 'done' | 'error'

interface ImagePickerProps {
  images: PickedImage[]
  max: number
  /** estado de subida por imagen (lo alimenta la página durante el envío). */
  uploadState: Record<string, ImageUploadState>
  onAddFiles: (files: File[]) => void
  onRemove: (id: string) => void
  addError: string | null
  disabled?: boolean
}

/** Selector de fotos con miniaturas y eliminación (UX §13). */
export function ImagePicker({
  images,
  max,
  uploadState,
  onAddFiles,
  onRemove,
  addError,
  disabled = false,
}: ImagePickerProps) {
  const remaining = max - images.length
  const canAdd = remaining > 0 && !disabled

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length > 0) onAddFiles(files)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {images.map((image) => {
          const state = uploadState[image.id]
          return (
            <div key={image.id} className="relative h-20 w-24 shrink-0">
              <img
                src={image.previewUrl}
                alt="Vista previa de la foto"
                className="border-arena-200 h-full w-full rounded-md border object-cover"
              />
              {state === 'uploading' ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                  <Loader2 className="size-5 animate-spin text-white" aria-hidden="true" />
                </div>
              ) : null}
              {state === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                  <TriangleAlert className="text-danger-400 size-5" aria-hidden="true" />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(image.id)}
                disabled={disabled || state === 'uploading'}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Quitar esta foto"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        })}

        {canAdd ? (
          <label className="border-arena-200 text-closed-500 hover:border-brand-300 hover:text-brand-600 flex h-20 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs font-medium">
            <ImagePlus className="size-5" aria-hidden="true" />
            Agregar
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleChange}
              className="sr-only"
              aria-label="Agregar fotos"
            />
          </label>
        ) : null}
      </div>

      <p className="text-closed-500 text-xs">
        {images.length === 0
          ? `Hasta ${max} fotos (opcional).`
          : `${remaining} ${remaining === 1 ? 'foto disponible' : 'fotos disponibles'}`}
      </p>

      {addError ? <Alert>{addError}</Alert> : null}
    </div>
  )
}
