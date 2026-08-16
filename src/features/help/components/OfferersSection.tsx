import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { HandHeart, Phone, UserX } from 'lucide-react'

import { getNeedContact, updateOfferStatus } from '@/features/help/services/helpService'
import type { HelpOfferStatus, NeedContact, Offerer } from '@/features/help/types'
import { HELP_OFFER_OWNER_NEXT } from '@/features/help/types'
import { OfferStatusBadge } from '@/features/help/components/OfferStatusBadge'
import { Alert } from '@/shared/components/Alert'
import { timeAgo } from '@/shared/utils/timeAgo'

const smallBtn =
  'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'
const primarySmall = `${smallBtn} border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100`
const subtleSmall = `${smallBtn} border-transparent text-closed-600 hover:bg-arena-100`

const NEXT_LABELS: Partial<Record<HelpOfferStatus, string>> = {
  CONTACTED: 'Marcar en contacto',
  AGREED: 'Acordar ayuda',
  COMPLETED: 'Marcar realizada',
  CONFIRMED: 'Confirmar ayuda',
}

interface OfferersSectionProps {
  needId: string
  offerers: Offerer[]
  currentUserId: string | null
  isOwner: boolean
  onChanged: () => void
  /** Si se provee, muestra el enlace "Reportar" junto a cada oferente. */
  reportUrlFor?: (offerer: Offerer) => string
  /** Acción de bloqueo por persona; la arma la página (MVP §21). */
  blockActionFor?: (userId: string, displayName: string) => ReactNode
}

/** Lista de personas que se ofrecieron con acciones según la relación (UX §16/§18). */
export function OfferersSection({
  needId,
  offerers,
  currentUserId,
  isOwner,
  onChanged,
  reportUrlFor,
  blockActionFor,
}: OfferersSectionProps) {
  const [contact, setContact] = useState<NeedContact | null>(null)
  const [contactFor, setContactFor] = useState<string | null>(null)
  const [loadingFor, setLoadingFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleContact(offerId: string) {
    setLoadingFor(offerId)
    setError(null)
    const result = await getNeedContact(needId)
    setLoadingFor(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setContact(result.data)
    setContactFor(offerId)
  }

  async function handleStatus(offer: Offerer, status: HelpOfferStatus) {
    setLoadingFor(offer.offer_id)
    setError(null)
    const result = await updateOfferStatus(offer.offer_id, status)
    setLoadingFor(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setContactFor(null)
    onChanged()
  }

  function nextLabel(status: HelpOfferStatus): string | null {
    const next = HELP_OFFER_OWNER_NEXT[status]
    return next ? (NEXT_LABELS[next] ?? null) : null
  }

  if (offerers.length === 0) {
    return <p className="text-closed-500 text-sm">Todavía nadie se ha ofrecido a ayudar.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <ul className="flex flex-col gap-2">
        {offerers.map((offer) => {
          const next = HELP_OFFER_OWNER_NEXT[offer.offer_status]
          const isMine = offer.user_id === currentUserId
          const busy = loadingFor === offer.offer_id
          const revealed = contactFor === offer.offer_id && contact
          const ownerPhone = isOwner
            ? (contact?.offerers?.find((o) => o.offer_id === offer.offer_id)?.phone ?? null)
            : null

          return (
            <li
              key={offer.offer_id}
              className="border-arena-200 rounded-lg border bg-white px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HandHeart className="text-brand-600 size-4 shrink-0" aria-hidden="true" />
                  <p className="text-closed-800 text-sm font-medium">{offer.display_name}</p>
                  <OfferStatusBadge status={offer.offer_status} />
                </div>
                <span className="text-closed-400 text-xs">{timeAgo(offer.offered_at)}</span>
                {reportUrlFor ? (
                  <Link
                    to={reportUrlFor(offer)}
                    className="text-closed-400 hover:text-danger-600 text-xs underline"
                  >
                    Reportar
                  </Link>
                ) : null}
                {blockActionFor ? blockActionFor(offer.user_id, offer.display_name) : null}
              </div>

              <p className="text-closed-500 mt-1 text-xs">
                Se ofrece a ayudar con:{' '}
                <span className="text-closed-700 font-medium">{offer.capability_label}</span>
              </p>
              <p className="text-closed-700 mt-1 text-sm whitespace-pre-line">{offer.message}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(isOwner || isMine) && (
                  <button
                    type="button"
                    className={primarySmall}
                    disabled={busy}
                    onClick={() => void handleContact(offer.offer_id)}
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    Contactar
                  </button>
                )}

                {isOwner ? (
                  <>
                    {next ? (
                      <button
                        type="button"
                        className={primarySmall}
                        disabled={busy}
                        onClick={() => void handleStatus(offer, next)}
                      >
                        {nextLabel(offer.offer_status)}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={subtleSmall}
                      disabled={busy}
                      onClick={() => void handleStatus(offer, 'CANCELLED')}
                    >
                      <UserX className="size-3.5" aria-hidden="true" />
                      Descartar
                    </button>
                  </>
                ) : isMine ? (
                  <button
                    type="button"
                    className={subtleSmall}
                    disabled={busy}
                    onClick={() => void handleStatus(offer, 'CANCELLED')}
                  >
                    <UserX className="size-3.5" aria-hidden="true" />
                    Cancelar oferta
                  </button>
                ) : null}
              </div>

              {revealed ? (
                <div className="border-info-100 bg-info-50 text-info-700 mt-2 rounded-lg border px-3 py-2 text-sm">
                  {isOwner ? (
                    <p>
                      Teléfono de {offer.display_name}:{' '}
                      <span className="font-semibold">{ownerPhone ?? 'no registró teléfono.'}</span>
                    </p>
                  ) : (
                    <p>
                      Teléfono del autor:{' '}
                      <span className="font-semibold">
                        {contact?.owner?.phone ?? 'no registró teléfono.'}
                      </span>
                      {contact?.owner?.address ? (
                        <span className="mt-1 block">Dirección: {contact.owner.address}</span>
                      ) : null}
                    </p>
                  )}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
