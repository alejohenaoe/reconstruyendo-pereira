/** Estados de una oferta de ayuda (public.help_offer_status). */
export type HelpOfferStatus = 'OFFERED' | 'CONTACTED' | 'AGREED' | 'COMPLETED' | 'CONFIRMED' | 'CANCELLED'

/** Lenguaje preciso (UX §16/§17): ofrecerse ≠ haber ayudado. */
export const HELP_OFFER_STATUS_LABELS: Record<HelpOfferStatus, string> = {
  OFFERED: 'Se ofreció a ayudar',
  CONTACTED: 'En contacto',
  AGREED: 'Ayuda acordada',
  COMPLETED: 'Ayuda realizada',
  CONFIRMED: 'Ayuda confirmada',
  CANCELLED: 'Oferta cancelada',
}

/** Secuencia que el autor de la necesidad puede avanzar (0002 trigger). */
export const HELP_OFFER_OWNER_NEXT: Record<HelpOfferStatus, HelpOfferStatus | null> = {
  OFFERED: 'CONTACTED',
  CONTACTED: 'AGREED',
  AGREED: 'COMPLETED',
  COMPLETED: 'CONFIRMED',
  CONFIRMED: null,
  CANCELLED: null,
}

export interface Capability {
  id: number
  slug: string
  label_es: string
}

/** Oferta pública de una persona que se ofreció (vista need_offer_details). */
export interface Offerer {
  offer_id: string
  user_id: string
  display_name: string
  offer_status: HelpOfferStatus
  message: string
  capability_id: number
  capability_label: string
  offered_at: string
}

export interface NeedComment {
  id: string
  need_id: string
  user_id: string
  body: string
  created_at: string
  display_name: string
}

/** Resultado del RPC get_need_contact (solo dueño u oferente; null si no hay relación). */
export interface OwnerContact {
  user_id: string
  display_name: string
  phone: string | null
  offer_id: string
  offer_status: HelpOfferStatus
}

export interface NeedContact {
  owner: { user_id: string; display_name: string; phone: string | null; address: string | null } | null
  offerers: OwnerContact[] | null
}

export type HelpResult<T> =
  | { ok: true; data: T; error: null; code: null }
  | { ok: false; data: null; error: string; code: 'unknown' }
