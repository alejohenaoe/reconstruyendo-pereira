import type { HelpOfferStatus } from '@/features/help/types'
import type { Need, NeedStatus } from '@/features/needs/types'

/**
 * Una oferta propia junto al pedido de ayuda al que pertenece (MVP §24).
 *
 * `needs` llega en `null` cuando el pedido fue ocultado por moderación: RLS no
 * lo devuelve y la interfaz lo dice en lugar de inventar un título.
 */
export interface MyOffer {
  id: string
  need_id: string
  status: HelpOfferStatus
  message: string
  created_at: string
  capabilities: { label_es: string } | null
  needs: { id: string; title: string; status: NeedStatus } | null
}

/** Clave de paginación por cursor: (created_at, id) — única y estable. */
export interface MyOffersCursor {
  createdAt: string
  id: string
}

export interface MyOffersPage {
  offers: MyOffer[]
  hasMore: boolean
  nextCursor: MyOffersCursor | null
}

export type ProfileResult<T> =
  { ok: true; data: T; error: null } | { ok: false; data: null; error: string }

/**
 * Diferencia entre las capacidades declaradas y las que la persona acaba de
 * elegir. Se guarda por diferencia (y no borrando todo para reinsertar) para no
 * dejar el perfil sin capacidades si la segunda escritura falla.
 */
export function capabilityChanges(
  current: number[],
  next: number[],
): { toAdd: number[]; toRemove: number[] } {
  const currentSet = new Set(current)
  const nextSet = new Set(next)
  return {
    toAdd: next.filter((id) => !currentSet.has(id)),
    toRemove: current.filter((id) => !nextSet.has(id)),
  }
}

/** Agrupa conservando el orden de llegada dentro de cada grupo. */
function groupBy<T, G extends string>(
  items: T[],
  groups: readonly G[],
  groupOf: (item: T) => G,
): Record<G, T[]> {
  const result = Object.fromEntries(groups.map((group) => [group, [] as T[]])) as Record<G, T[]>
  for (const item of items) result[groupOf(item)].push(item)
  return result
}

// ---------- Mis pedidos de ayuda (MVP §24) ----------

export type MyNeedGroup = 'active' | 'resolved' | 'closed'

/** Un pedido abierto o en proceso es el "actual": solo puede haber uno activo (MVP §8). */
export const MY_NEED_GROUP_OF: Record<NeedStatus, MyNeedGroup> = {
  OPEN: 'active',
  IN_PROGRESS: 'active',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
}

export const MY_NEED_GROUP_LABELS: Record<MyNeedGroup, string> = {
  active: 'Pedido actual',
  resolved: 'Solucionados',
  closed: 'Cerrados',
}

export const MY_NEED_GROUP_ORDER: readonly MyNeedGroup[] = ['active', 'resolved', 'closed']

export function groupMyNeeds(needs: Need[]): Record<MyNeedGroup, Need[]> {
  return groupBy(needs, MY_NEED_GROUP_ORDER, (need) => MY_NEED_GROUP_OF[need.status])
}

// ---------- Mis ayudas (MVP §24) ----------

export type MyOfferGroup = 'pending' | 'confirmed' | 'cancelled'

/**
 * "Realizada" todavía cuenta como pendiente: solo la persona que pidió la ayuda
 * puede confirmarla (MVP §11), y la interfaz no debe adelantarse (UX §16).
 */
export const MY_OFFER_GROUP_OF: Record<HelpOfferStatus, MyOfferGroup> = {
  OFFERED: 'pending',
  CONTACTED: 'pending',
  AGREED: 'pending',
  COMPLETED: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
}

export const MY_OFFER_GROUP_LABELS: Record<MyOfferGroup, string> = {
  pending: 'Ayudas pendientes',
  confirmed: 'Ayudas confirmadas',
  cancelled: 'Ofertas canceladas',
}

export const MY_OFFER_GROUP_ORDER: readonly MyOfferGroup[] = ['pending', 'confirmed', 'cancelled']

export function groupMyOffers(offers: MyOffer[]): Record<MyOfferGroup, MyOffer[]> {
  return groupBy(offers, MY_OFFER_GROUP_ORDER, (offer) => MY_OFFER_GROUP_OF[offer.status])
}
