import { useState } from 'react'

import { Expand, ImageOff } from 'lucide-react'

import { NeedImage } from '@/features/needs/components/NeedImage'
import { needImageOriginalUrl, needImageUrl } from '@/features/needs/services/needService'
import type { NeedImage as NeedImageRow } from '@/features/needs/types'

interface NeedGalleryProps {
  images: NeedImageRow[]
}

/** Galería con imagen principal + miniaturas (UX §37: fotografías como evidencia). */
export function NeedGallery({ images }: NeedGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const ordered = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))

  if (ordered.length === 0) {
    return (
      <div className="text-closed-500 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-closed-100 bg-closed-100/40">
        <ImageOff className="size-6" aria-hidden="true" />
        <p className="text-sm">Esta necesidad no tiene fotografías.</p>
      </div>
    )
  }

  const active = ordered[activeIndex]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <NeedImage
          src={needImageUrl(active.storage_path, 800, 600)}
          fallbackSrc={needImageOriginalUrl(active.storage_path)}
          alt="Foto principal de la necesidad"
          className="aspect-[4/3] w-full rounded-lg"
        />
        <a
          href={needImageOriginalUrl(active.storage_path)}
          target="_blank"
          rel="noreferrer"
          className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/75"
        >
          <Expand className="size-3.5" aria-hidden="true" />
          Ampliar
        </a>
      </div>
      {ordered.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Galería de fotos">
          {ordered.map((row, index) => (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-opacity ${
                index === activeIndex ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={needImageUrl(row.storage_path, 80, 60)}
                alt={`Miniatura ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
