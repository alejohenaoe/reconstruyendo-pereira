import type { Capability, HelpOfferStatus, HelpResult, NeedComment, NeedContact, Offerer } from '@/features/help/types'
import { supabase } from '@/shared/lib/supabase'

const COMMENT_LIMIT = 200

/** Traduce errores de ofertas/comentarios a mensajes humanos (UX §25, §40). */
function mapCommunityError(error: { code?: string | null; message?: string } | null, fallback: string): string {
  const code = error?.code ?? ''
  const message = error?.message ?? ''
  if (message.includes('no acepta nuevas ofertas')) {
    return 'Esta necesidad ya fue solucionada y ya no acepta nuevas ofertas.'
  }
  if (message.includes('No puedes ofrecer ayuda en tu propia necesidad')) {
    return 'No puedes ofrecer ayuda en tu propia necesidad.'
  }
  if (message.includes('La necesidad no existe') || message.includes('no está disponible')) {
    return 'Esta necesidad ya no está disponible.'
  }
  if (code === '23505') {
    return 'Ya te ofreciste a ayudar en esta necesidad.'
  }
  if (message.includes('Solo el autor puede cambiar el estado de la necesidad')) {
    return 'Solo el autor puede cambiar el estado de la necesidad.'
  }
  if (message.includes('Transición de estado no permitida')) {
    return 'No puedes pasar la necesidad a ese estado.'
  }
  if (message.includes('no puede reabrirse')) {
    return 'Una necesidad solucionada o cerrada no puede reabrirse.'
  }
  return fallback
}

export async function getCapabilities(): Promise<HelpResult<Capability[]>> {
  const { data, error } = await supabase.from('capabilities').select('id, slug, label_es').order('id')
  if (error) return { ok: false, data: null, error: 'No pudimos cargar las capacidades.', code: 'unknown' }
  return { ok: true, data: data as Capability[], error: null, code: null }
}

/** Oferentes públicos de una necesidad (vista con capacidad; sin ofertas canceladas). */
export async function getOfferers(needId: string): Promise<HelpResult<Offerer[]>> {
  const { data, error } = await supabase
    .from('need_offer_details')
    .select('offer_id, user_id, display_name, offer_status, message, capability_id, capability_label, offered_at')
    .eq('need_id', needId)
    .order('offered_at', { ascending: true })
    .limit(100)
  if (error) return { ok: false, data: null, error: 'No pudimos cargar las ofertas.', code: 'unknown' }
  return { ok: true, data: (data ?? []) as Offerer[], error: null, code: null }
}

export async function createHelpOffer(
  needId: string,
  capabilityId: number,
  message: string,
): Promise<HelpResult<null>> {
  const { error } = await supabase.from('help_offers').insert({
    need_id: needId,
    capability_id: capabilityId,
    message,
    status: 'OFFERED',
  })
  if (error) {
    return {
      ok: false,
      data: null,
      error: mapCommunityError(error, 'No pudimos registrar tu oferta de ayuda. Inténtalo de nuevo.'),
      code: 'unknown',
    }
  }
  return { ok: true, data: null, error: null, code: null }
}

/** Cambia el estado de una oferta (el autor avanza; el oferente solo cancela). */
export async function updateOfferStatus(offerId: string, status: HelpOfferStatus): Promise<HelpResult<null>> {
  const { error } = await supabase.from('help_offers').update({ status }).eq('id', offerId)
  if (error) {
    return {
      ok: false,
      data: null,
      error: mapCommunityError(error, 'No pudimos actualizar la oferta. Inténtalo de nuevo.'),
      code: 'unknown',
    }
  }
  return { ok: true, data: null, error: null, code: null }
}

/**
 * Contacto privado (RPC security definer + contact_access_log).
 * Solo dueño u oferente no cancelado; cualquier otro obtiene `null`.
 */
export async function getNeedContact(needId: string): Promise<HelpResult<NeedContact | null>> {
  const { data, error } = await supabase.rpc('get_need_contact', { need_id: needId })
  if (error) return { ok: false, data: null, error: 'No pudimos obtener el contacto.', code: 'unknown' }
  return { ok: true, data: (data as unknown as NeedContact | null) ?? null, error: null, code: null }
}

/** Hilo de colaboración (need_comments no ocultos) con el nombre de cada autor. */
export async function getComments(needId: string): Promise<HelpResult<NeedComment[]>> {
  const { data, error } = await supabase
    .from('need_comments')
    .select('id, need_id, user_id, body, created_at')
    .eq('need_id', needId)
    .order('created_at', { ascending: true })
    .limit(COMMENT_LIMIT)
  if (error) return { ok: false, data: null, error: 'No pudimos cargar el hilo.', code: 'unknown' }

  const rows = (data ?? []) as Omit<NeedComment, 'display_name'>[]
  const userIds = [...new Set(rows.map((row) => row.user_id))]
  const names = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    for (const profile of (profiles ?? []) as { id: string; display_name: string }[]) {
      names.set(profile.id, profile.display_name)
    }
  }

  return {
    ok: true,
    data: rows.map((row) => ({ ...row, display_name: names.get(row.user_id) ?? 'Un vecino' })),
    error: null,
    code: null,
  }
}

export async function addComment(needId: string, body: string): Promise<HelpResult<null>> {
  const { error } = await supabase.from('need_comments').insert({ need_id: needId, body })
  if (error) {
    return { ok: false, data: null, error: mapCommunityError(error, 'No pudimos publicar tu mensaje.'), code: 'unknown' }
  }
  return { ok: true, data: null, error: null, code: null }
}

/** Cambio de estado de la necesidad por su autor (OPEN → IN_PROGRESS → RESOLVED; cierre a CLOSED). */
export async function updateNeedStatus(needId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'): Promise<HelpResult<null>> {
  const { error } = await supabase.from('needs').update({ status }).eq('id', needId)
  if (error) {
    return {
      ok: false,
      data: null,
      error: mapCommunityError(error, 'No pudimos actualizar el estado. Inténtalo de nuevo.'),
      code: 'unknown',
    }
  }
  return { ok: true, data: null, error: null, code: null }
}

export async function getOwnPhone(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profile_phone')
    .select('phone')
    .eq('profile_id', userId)
    .maybeSingle()
  if (!data) return ''
  return (data as { phone: string }).phone
}

export async function saveOwnPhone(userId: string, phone: string): Promise<HelpResult<null>> {
  const { error } = await supabase
    .from('profile_phone')
    .upsert({ profile_id: userId, phone }, { onConflict: 'profile_id' })
  if (error) return { ok: false, data: null, error: 'No pudimos guardar el teléfono.', code: 'unknown' }
  return { ok: true, data: null, error: null, code: null }
}
