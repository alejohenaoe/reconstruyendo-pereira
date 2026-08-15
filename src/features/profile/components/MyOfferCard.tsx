import { Link } from 'react-router-dom'

import { OfferStatusBadge } from '@/features/help/components/OfferStatusBadge'
import { NeedStatus } from '@/features/needs/components/NeedStatus'
import type { MyOffer } from '@/features/profile/types'
import { timeAgo } from '@/shared/utils/timeAgo'

interface MyOfferCardProps {
  offer: MyOffer
}

/**
 * Una ayuda que ofrecí: a qué pedido, con qué capacidad y en qué punto va
 * (UX §16: ofrecerse no es haber ayudado).
 */
export function MyOfferCard({ offer }: MyOfferCardProps) {
  const need = offer.needs

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-brand-800 line-clamp-1 text-base font-semibold">
          {need ? need.title : 'Pedido de ayuda no disponible'}
        </h3>
        {need ? <NeedStatus status={need.status} /> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <OfferStatusBadge status={offer.status} />
        {offer.capabilities ? (
          <span className="text-closed-500 text-xs">Ofrecí: {offer.capabilities.label_es}</span>
        ) : null}
      </div>
      <p className="text-closed-600 mt-2 line-clamp-2 text-sm">{offer.message}</p>
      <p className="text-closed-400 mt-2 text-xs">{timeAgo(offer.created_at)}</p>
    </>
  )

  if (!need) {
    return (
      <li className="border-arena-200 rounded-lg border bg-white p-4 shadow-sm">
        {body}
        <p className="text-closed-500 mt-2 text-xs">
          Este pedido de ayuda ya no está visible en la plataforma.
        </p>
      </li>
    )
  }

  return (
    <li>
      <Link
        to={`/needs/${need.id}`}
        className="group focus-visible:ring-brand-600 border-arena-200 block rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2"
      >
        {body}
      </Link>
    </li>
  )
}
