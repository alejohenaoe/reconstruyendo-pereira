import type { Need, NeedsResult } from '@/features/needs/types'
import { compressImage } from '@/shared/utils/imageCompress'
import { supabase } from '@/shared/lib/supabase'

export interface CreateNeedInput {
  title: string
  description: string
  categoryId: number
  municipalityId: number
  neighborhood: string | null
  needsAssessment: boolean
}

export interface UploadedNeedImage {
  storagePath: string
  isPrimary: boolean
}

const NEED_PUBLISH_SELECT =
  'id,user_id,title,description,category_id,municipality_id,neighborhood,status,needs_assessment,resolution_note,created_at'

/** Traduce errores de publicación a mensajes humanos (UX §25). */
export function mapPublishError(error: { code?: string | null; message?: string }): string {
  const code = error.code ?? ''
  const message = error.message ?? ''
  if (code === '23505' || message.includes('one_active_need_per_user')) {
    return 'Ya tienes un pedido de ayuda activo. Espera a que se resuelva o se cierre antes de publicar otro.'
  }
  if (code === '23514') {
    return 'Alguno de los campos no cumple con el largo permitido. Revisa el formulario.'
  }
  if (message.includes('row-level security')) {
    return 'No estás autorizado para publicar el pedido de ayuda.'
  }
  return 'No pudimos publicar el pedido de ayuda. Inténtalo de nuevo.'
}

/** Crea la necesidad (status OPEN). El user_id explícito lo exige la RLS
 *  (`user_id = auth.uid()`) porque la columna no tiene valor por defecto. */
export async function createNeed(
  input: CreateNeedInput,
  userId: string,
): Promise<NeedsResult<Need>> {
  const { data, error } = await supabase
    .from('needs')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      municipality_id: input.municipalityId,
      neighborhood: input.neighborhood,
      needs_assessment: input.needsAssessment,
      status: 'OPEN',
    })
    .select(NEED_PUBLISH_SELECT)
    .single()

  if (error) return { ok: false, data: null, error: mapPublishError(error), code: 'unknown' }
  return { ok: true, data: data as unknown as Need, error: null, code: null }
}

/** Guarda la dirección exacta (privada; RLS: solo el dueño la ve). */
export async function attachAddress(
  needId: string,
  address: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('need_address').insert({ need_id: needId, address })
  if (error) return { ok: false, error: 'No pudimos guardar la dirección.' }
  return { ok: true, error: null }
}

/**
 * Comprime la foto, la sube al bucket y la vincula a la necesidad.
 * Nunca almacena el original: solo el webp comprimido.
 */
export async function uploadNeedImage(
  needId: string,
  file: File,
  isPrimary: boolean,
  kind: 'BEFORE' | 'AFTER' = 'BEFORE',
): Promise<NeedsResult<UploadedNeedImage>> {
  let blob: Blob
  try {
    const compressed = await compressImage(file)
    blob = compressed.blob
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : 'No pudimos procesar una de las fotos.',
      code: 'unknown',
    }
  }

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `needs/${needId}/${fileId()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('need-images')
    .upload(storagePath, blob, { contentType: blob.type, upsert: false })
  if (uploadError) {
    return {
      ok: false,
      data: null,
      error: 'No pudimos subir una de las fotos. Inténtalo de nuevo.',
      code: 'unknown',
    }
  }

  const { error: insertError } = await supabase.from('need_images').insert({
    need_id: needId,
    storage_path: storagePath,
    kind,
    is_primary: isPrimary,
  })
  if (insertError) {
    await supabase.storage.from('need-images').remove([storagePath])
    return {
      ok: false,
      data: null,
      error: 'No pudimos guardar una de las fotos. Inténtalo de nuevo.',
      code: 'unknown',
    }
  }

  return { ok: true, data: { storagePath, isPrimary }, error: null, code: null }
}

function fileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
}
