import type { HelpOfferStatus } from '@/features/help/types'
import { HELP_OFFER_STATUS_LABELS } from '@/features/help/types'

const CONFIG: Record<HelpOfferStatus, string> = {
  OFFERED: 'bg-need-100 text-need-700',
  CONTACTED: 'bg-info-100 text-info-700',
  AGREED: 'bg-progress-100 text-progress-700',
  COMPLETED: 'bg-progress-100 text-progress-700',
  CONFIRMED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-closed-100 text-closed-600',
}

interface OfferStatusBadgeProps {
  status: HelpOfferStatus
}

/** Lenguaje preciso del estado de una oferta (UX §16/§17). */
export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIG[status]}`}
    >
      {HELP_OFFER_STATUS_LABELS[status]}
    </span>
  )
}
