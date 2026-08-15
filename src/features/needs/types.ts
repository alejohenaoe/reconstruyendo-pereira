import type { Municipality } from '@/features/auth/types'

/** Estados posibles de una necesidad (public.need_status). */
export type NeedStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  OPEN: 'Necesita ayuda',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Solucionada',
  CLOSED: 'Cerrada',
}

export const NEED_STATUS_ORDER: NeedStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export interface NeedCategory {
  id: number
  slug: string
  label_es: string
}

/** Fila pública de una necesidad (la lectura la acota RLS en el backend). */
export interface Need {
  id: string
  user_id: string
  title: string
  description: string
  category_id: number
  municipality_id: number
  neighborhood: string | null
  status: NeedStatus
  needs_assessment: boolean
  created_at: string
  need_categories: Pick<NeedCategory, 'label_es'> | null
  municipalities: Pick<Municipality, 'name'> | null
}

export interface NeedFilters {
  municipalityId: number | null
  categoryId: number | null
  status: NeedStatus | null
}

/** Clave de paginación por cursor: (created_at, id) — única y estable. */
export interface NeedsCursor {
  createdAt: string
  id: string
}

export interface NeedsPage {
  needs: Need[]
  hasMore: boolean
  nextCursor: NeedsCursor | null
}

export interface NeedImage {
  id: string
  need_id: string
  storage_path: string
  kind: 'BEFORE' | 'AFTER'
  is_primary: boolean
}

export interface OfferCount {
  need_id: string
  offer_count: number
}

export type NeedsResult<T> =
  | { ok: true; data: T; error: null; code: null }
  | { ok: false; data: null; error: string; code: 'not_found' | 'unknown' }
