import type {
  Need,
  NeedCategory,
  NeedFilters,
  NeedImage,
  NeedsCursor,
  NeedsPage,
  NeedsResult,
  OfferCount,
} from '@/features/needs/types'
import { supabase } from '@/shared/lib/supabase'

export const NEEDS_PAGE_SIZE = 8

const NEED_SELECT =
  'id,user_id,title,description,category_id,municipality_id,neighborhood,status,needs_assessment,resolution_note,created_at,need_categories(label_es),municipalities(name)'

const IMAGE_BUCKET = 'need-images'

export async function getNeedCategories(): Promise<NeedsResult<NeedCategory[]>> {
  const { data, error } = await supabase
    .from('need_categories')
    .select('id, slug, label_es')
    .order('id')
  if (error)
    return { ok: false, data: null, error: 'No pudimos cargar las categorías.', code: 'unknown' }
  return { ok: true, data: data as NeedCategory[], error: null, code: null }
}

/**
 * Lista pública con paginación por cursor (created_at desc, id desc).
 * Se piden PAGE_SIZE+1 filas para detectar si hay más sin hacer un COUNT.
 */
export async function getPublicNeeds(
  filters: NeedFilters,
  cursor: NeedsCursor | null,
): Promise<NeedsResult<NeedsPage>> {
  let query = supabase
    .from('needs')
    .select(NEED_SELECT)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(NEEDS_PAGE_SIZE + 1)

  if (filters.municipalityId !== null) query = query.eq('municipality_id', filters.municipalityId)
  if (filters.categoryId !== null) query = query.eq('category_id', filters.categoryId)
  if (filters.status !== null) query = query.eq('status', filters.status)

  if (cursor) {
    // Keyset: created_at < X OR (created_at = X AND id < Y). postgrest-js
    // envuelve el valor en paréntesis para el operador `or=(...)`.
    query = query.or(
      `and(created_at.lt.${cursor.createdAt}),and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error)
    return {
      ok: false,
      data: null,
      error: 'No pudimos cargar los pedidos de ayuda.',
      code: 'unknown',
    }

  return { ok: true, data: toNeedsPage((data ?? []) as unknown as Need[]), error: null, code: null }
}

/**
 * Los pedidos de ayuda de una persona, en todos sus estados y con la misma
 * paginación por cursor (historial, MVP §24). RLS deja ver los propios aunque
 * estén ocultos por moderación.
 */
export async function getNeedsByUser(
  userId: string,
  cursor: NeedsCursor | null,
): Promise<NeedsResult<NeedsPage>> {
  let query = supabase
    .from('needs')
    .select(NEED_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(NEEDS_PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `and(created_at.lt.${cursor.createdAt}),and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error)
    return {
      ok: false,
      data: null,
      error: 'No pudimos cargar tus pedidos de ayuda.',
      code: 'unknown',
    }

  return { ok: true, data: toNeedsPage((data ?? []) as unknown as Need[]), error: null, code: null }
}

/** Corta la fila extra de PAGE_SIZE+1 y arma el cursor de la página siguiente. */
function toNeedsPage(rows: Need[]): NeedsPage {
  const hasMore = rows.length > NEEDS_PAGE_SIZE
  const needs = hasMore ? rows.slice(0, NEEDS_PAGE_SIZE) : rows
  const last = needs[needs.length - 1] ?? null

  return {
    needs,
    hasMore,
    nextCursor: hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
  }
}

export async function getNeedById(id: string): Promise<NeedsResult<Need>> {
  const { data, error } = await supabase
    .from('needs')
    .select(NEED_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error)
    return {
      ok: false,
      data: null,
      error: 'No pudimos cargar el pedido de ayuda.',
      code: 'unknown',
    }
  if (!data)
    return {
      ok: false,
      data: null,
      error: 'No encontramos este pedido de ayuda.',
      code: 'not_found',
    }
  return { ok: true, data: data as unknown as Need, error: null, code: null }
}

/** Conteo agrupado de ofertas (vista need_offer_counts, una query para N necesidades). */
export async function getOfferCounts(needIds: string[]): Promise<OfferCount[]> {
  if (needIds.length === 0) return []
  const { data, error } = await supabase
    .from('need_offer_counts')
    .select('need_id, offer_count')
    .in('need_id', needIds)
  if (error) return []
  return (data ?? []) as OfferCount[]
}

/** Imágenes de varias necesidades en una sola query (miniaturas para el listado). */
export async function getNeedImages(needIds: string[]): Promise<NeedImage[]> {
  if (needIds.length === 0) return []
  const { data, error } = await supabase
    .from('need_images')
    .select('id, need_id, storage_path, kind, is_primary')
    .in('need_id', needIds)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) return []
  return (data ?? []) as NeedImage[]
}

/** Nombre público del autor de una necesidad (profiles). */
export async function getAuthorName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return (data as { display_name: string }).display_name
}

/** URL con transformación de imagen (miniatura); falla solo si el bucket no la soporta. */
export function needImageUrl(storagePath: string, width: number, height: number): string {
  const { data } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(storagePath, { transform: { width, height, resize: 'cover' } })
  return data.publicUrl
}

/** URL original sin transformar (fallback y "ver imagen completa"). */
export function needImageOriginalUrl(storagePath: string): string {
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
