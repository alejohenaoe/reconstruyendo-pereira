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
  /** Ocultado por moderación: por RLS solo lo ven su autor y los administradores. */
  is_hidden: boolean
  /** Actualización pública del cierre, escrita por el autor (MVP §23). */
  resolution_note: string | null
  created_at: string
  need_categories: Pick<NeedCategory, 'label_es'> | null
  municipalities: Pick<Municipality, 'name'> | null
}

/**
 * Términos que sugieren que un pedido de ayuda involucra elementos que sostienen
 * la vivienda (MVP §22). Se comparan contra el texto normalizado (minúsculas y
 * sin tildes), por eso se escriben sin tildes y en raíz: así cubren plurales y
 * variantes ("grieta"/"grietas", "agrietada"/"agrietado").
 *
 * La lista incluye la categoría `Evaluación profesional` porque pedir una
 * evaluación tras el terremoto es, justamente, el caso de "daño cuya naturaleza
 * no es clara" del que habla el MVP.
 *
 * Deliberadamente NO incluye "pared" ni "muro" a secas: aparecen en casi
 * cualquier pedido (pintar, resanar) y volverían la advertencia ruido constante
 * (UX §3.5, §38). Sí entran cuando vienen con una señal de daño ("agrietada",
 * "muro de carga").
 */
export const STRUCTURAL_HINT_TERMS = [
  'columna',
  'viga',
  'cimiento',
  'cimentacion',
  'muro de carga',
  'muro estructural',
  'estructura',
  'estructural',
  'placa',
  'losa',
  'entrepiso',
  'grieta',
  'fisura',
  'agrietad',
  'resquebraj',
  'hundimiento',
  'se hundio',
  'desplazamiento',
  'desplom',
  'inclinad',
  'se inclino',
  'colapso',
  'colapsad',
  'derrumb',
  'se vino abajo',
  'evaluacion profesional',
]

export interface StructuralRiskInput {
  title: string
  description: string
  categoryLabel?: string | null
  needsAssessment?: boolean
}

/** Minúsculas y sin tildes, para comparar texto escrito por personas. */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Detecta si un pedido de ayuda puede involucrar daño estructural (MVP §22)
 * para mostrar la advertencia de evaluación profesional.
 *
 * Es una heurística de presentación, no una evaluación técnica: ante la duda
 * prefiere advertir de más. Marcar "no sé exactamente qué necesito" siempre
 * cuenta como señal, porque es un daño de naturaleza no clara.
 */
export function hasStructuralRisk({
  title,
  description,
  categoryLabel,
  needsAssessment,
}: StructuralRiskInput): boolean {
  if (needsAssessment) return true
  const text = normalizeText([title, description, categoryLabel ?? ''].join(' '))
  return STRUCTURAL_HINT_TERMS.some((term) => text.includes(term))
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
