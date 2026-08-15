import type { MyOffer, MyOffersCursor, MyOffersPage, ProfileResult } from '@/features/profile/types'
import { supabase } from '@/shared/lib/supabase'

export const MY_OFFERS_PAGE_SIZE = 10

const MY_OFFER_SELECT =
  'id,need_id,status,message,created_at,capabilities(label_es),needs(id,title,status)'

/**
 * Mis ofertas de ayuda, paginadas por cursor (created_at desc, id desc).
 * Se piden PAGE_SIZE+1 filas para saber si hay más sin hacer un COUNT.
 *
 * El filtro por `user_id` es explícito: RLS permite leer ofertas ajenas (son
 * públicas mientras el pedido no esté oculto), así que acotar aquí es parte de
 * la consulta, no de la seguridad.
 */
export async function listMyOffers(
  userId: string,
  cursor: MyOffersCursor | null,
): Promise<ProfileResult<MyOffersPage>> {
  let query = supabase
    .from('help_offers')
    .select(MY_OFFER_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(MY_OFFERS_PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `and(created_at.lt.${cursor.createdAt}),and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) return { ok: false, data: null, error: 'No pudimos cargar tus ayudas.' }

  const rows = (data ?? []) as unknown as MyOffer[]
  const hasMore = rows.length > MY_OFFERS_PAGE_SIZE
  const offers = hasMore ? rows.slice(0, MY_OFFERS_PAGE_SIZE) : rows
  const last = offers[offers.length - 1] ?? null

  return {
    ok: true,
    data: {
      offers,
      hasMore,
      nextCursor: hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
    },
    error: null,
  }
}
