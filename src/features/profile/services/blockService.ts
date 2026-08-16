import type { BlockedPerson, ProfileResult } from '@/features/profile/types'
import { supabase } from '@/shared/lib/supabase'

/**
 * Bloqueo entre personas (MVP §21). El `blocker_id` explícito lo exige la RLS
 * (`blocker_id = auth.uid()`): la columna no tiene valor por defecto.
 *
 * El efecto real lo aplica el backend (políticas y triggers): dejan de verse en
 * el hilo y en las ofertas, no pueden ofrecerse ayuda y el contacto deja de
 * revelarse. Aquí solo se registra la decisión.
 */
export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<ProfileResult<null>> {
  const { error } = await supabase
    .from('user_blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId })
  if (error) {
    // Bloquear a alguien ya bloqueado no es un error para quien lo pulsa.
    if (error.code === '23505') return { ok: true, data: null, error: null }
    return { ok: false, data: null, error: 'No pudimos bloquear a esta persona.' }
  }
  return { ok: true, data: null, error: null }
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<ProfileResult<null>> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) return { ok: false, data: null, error: 'No pudimos quitar el bloqueo.' }
  return { ok: true, data: null, error: null }
}

/** Las personas que yo bloqueé, con su nombre público para poder desbloquear. */
export async function listMyBlocks(blockerId: string): Promise<ProfileResult<BlockedPerson[]>> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false })
  if (error) return { ok: false, data: null, error: 'No pudimos cargar tus bloqueos.' }

  const rows = (data ?? []) as { blocked_id: string; created_at: string }[]
  if (rows.length === 0) return { ok: true, data: [], error: null }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in(
      'id',
      rows.map((row) => row.blocked_id),
    )
  const names = new Map(
    ((profiles ?? []) as { id: string; display_name: string }[]).map((row) => [
      row.id,
      row.display_name,
    ]),
  )

  return {
    ok: true,
    data: rows.map((row) => ({
      user_id: row.blocked_id,
      display_name: names.get(row.blocked_id) ?? 'Alguien',
      created_at: row.created_at,
    })),
    error: null,
  }
}

/** Ids que bloqueé, para que la interfaz no ofrezca bloquear dos veces. */
export async function listMyBlockedIds(blockerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId)
  if (error) return new Set()
  return new Set(((data ?? []) as { blocked_id: string }[]).map((row) => row.blocked_id))
}
