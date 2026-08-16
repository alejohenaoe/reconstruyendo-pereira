import { Link } from 'react-router-dom'

import { EyeOff, HandHeart, MapPin } from 'lucide-react'

import { NeedImage } from '@/features/needs/components/NeedImage'
import { NeedStatus } from '@/features/needs/components/NeedStatus'
import type { Need } from '@/features/needs/types'
import { timeAgo } from '@/shared/utils/timeAgo'

interface NeedCardProps {
  need: Need
  offerCount: number
  image: { thumb: string; original: string } | null
}

/** Tarjeta del listado público (UX §9: título, ubicación, estado, fecha, extracto, ofertas). */
export function NeedCard({ need, offerCount, image }: NeedCardProps) {
  const location = [need.municipalities?.name, need.neighborhood].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/needs/${need.id}`}
      className="group focus-visible:ring-brand-600 border-arena-200 flex gap-4 rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2"
    >
      <NeedImage
        src={image?.thumb ?? null}
        fallbackSrc={image?.original}
        alt={`Fotos del pedido de ayuda: ${need.title}`}
        className="h-24 w-24 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-brand-800 group-hover:text-brand-700 line-clamp-1 text-base font-semibold">
            {need.title}
          </h2>
          <NeedStatus status={need.status} />
        </div>
        {/* Solo su autor (y los administradores) llegan a ver esta tarjeta: RLS
            no devuelve los pedidos ocultos a nadie más. */}
        {need.is_hidden ? (
          <p className="text-danger-600 mt-1 flex items-center gap-1 text-xs font-medium">
            <EyeOff className="size-3.5 shrink-0" aria-hidden="true" />
            Oculto por moderación
          </p>
        ) : null}
        <p className="text-closed-500 mt-0.5 flex items-center gap-1 truncate text-sm">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {location || 'Ubicación no especificada'}
        </p>
        <p className="text-closed-600 mt-1 line-clamp-2 text-sm">{need.description}</p>
        <div className="text-closed-500 mt-2 flex items-center justify-between gap-2 text-xs">
          <span>{timeAgo(need.created_at)}</span>
          {offerCount > 0 ? (
            <span className="text-brand-700 flex items-center gap-1 font-medium">
              <HandHeart className="size-3.5" aria-hidden="true" />
              {offerCount} {offerCount === 1 ? 'persona se ofreció' : 'personas se ofrecieron'}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
