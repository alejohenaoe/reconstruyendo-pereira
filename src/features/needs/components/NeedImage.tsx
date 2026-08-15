import { useEffect, useState } from 'react'

import { ImageOff, ImagePlus } from 'lucide-react'

interface NeedImageProps {
  src: string | null
  alt: string
  /** URL alternativa si la transformación de imagen falla (storage antiguo). */
  fallbackSrc?: string | null
  className?: string
}

type ImageState = 'empty' | 'loading' | 'loaded' | 'error'

/** Imagen con estados de carga/error/placeholder (UX §23) y fallback a la original. */
export function NeedImage({ src, fallbackSrc, alt, className }: NeedImageProps) {
  const [activeSrc, setActiveSrc] = useState<string | null>(src)
  const [state, setState] = useState<ImageState>(src ? 'loading' : 'empty')

  useEffect(() => {
    setActiveSrc(src)
    setState(src ? 'loading' : 'empty')
  }, [src])

  function handleError() {
    if (fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc)
      setState('loading')
    } else {
      setState('error')
    }
  }

  return (
    <div className={`relative overflow-hidden bg-closed-100 ${className ?? ''}`}>
      {state === 'loading' ? (
        <div className="absolute inset-0 animate-pulse bg-closed-100" aria-hidden="true" />
      ) : null}
      {activeSrc && state !== 'error' ? (
        <img
          src={activeSrc}
          alt={alt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setState('loaded')}
          onError={handleError}
        />
      ) : null}
      {state === 'empty' ? (
        <div className="text-closed-500 absolute inset-0 flex items-center justify-center">
          <ImagePlus className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      {state === 'error' ? (
        <div className="text-closed-500 absolute inset-0 flex items-center justify-center">
          <ImageOff className="size-5" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  )
}
