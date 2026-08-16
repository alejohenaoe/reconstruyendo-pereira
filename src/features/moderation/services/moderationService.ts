import type {
  AdminComment,
  AdminNeed,
  AdminStats,
  AdminUser,
  ModResult,
  ReportReason,
  ReportStatus,
  ReportTarget,
  ReportView,
} from '@/features/moderation/types'
import { supabase } from '@/shared/lib/supabase'

const ADMIN_LIST_LIMIT = 200

/** Traduce errores de moderación/reportes a mensajes humanos (UX §25). */
function mapModerationError(
  error: { code?: string | null; message?: string } | null,
  fallback: string,
): string {
  const code = error?.code ?? ''
  const message = error?.message ?? ''
  if (code === '23505') {
    return 'Ya reportaste este contenido. Lo revisaremos igualmente.'
  }
  if (message.includes('Se requieren permisos de administrador')) {
    return 'No tienes permisos de administrador.'
  }
  if (message.includes('No puedes reportarte a ti mismo')) {
    return 'No puedes reportarte a ti mismo.'
  }
  return fallback
}

async function displayNameOf(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  const unique = [...new Set(userIds)]
  if (unique.length === 0) return names
  const { data } = await supabase.from('profiles').select('id, display_name').in('id', unique)
  for (const profile of (data ?? []) as { id: string; display_name: string }[]) {
    names.set(profile.id, profile.display_name)
  }
  return names
}

// ---------- Reportes (cualquier verificado) ----------

/**
 * Registra un reporte. El `reporter_id` explícito lo exige la RLS
 * (`reporter_id = auth.uid()`): sin él el insert se rechaza con 403.
 */
export async function createReport(
  target: ReportTarget,
  reporterId: string,
  reason: ReportReason,
  details: string,
): Promise<ModResult<null>> {
  const payload: Record<string, unknown> = {
    reporter_id: reporterId,
    reason,
    details: details.trim() || null,
  }
  if (target.type === 'need') payload.need_id = target.id
  else if (target.type === 'comment') payload.comment_id = target.id
  else payload.reported_user_id = target.id

  const { error } = await supabase.from('reports').insert(payload)
  if (error) {
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos registrar el reporte. Inténtalo de nuevo.'),
    }
  }
  return { ok: true, data: null, error: null }
}

// ---------- Panel admin: reportes ----------

/** Reportes para moderar, enriquecidos con autor del reporte y descripción del objetivo. */
export async function getReports(): Promise<ModResult<ReportView[]>> {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, reporter_id, need_id, comment_id, reported_user_id, reason, details, status, moderated_by, created_at, resolved_at, need:needs(title), comment:need_comments(body, is_hidden)',
    )
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_LIMIT)
  if (error) return { ok: false, data: null, error: 'No pudimos cargar los reportes.' }

  // postgrest-js infiere arreglos para los embeds al no haber tipos generados
  // de la base, pero en tiempo de ejecución una relación a-uno llega como
  // objeto: de ahí el doble casteo (verificado por API contra el stack local).
  const rows = (data ?? []) as unknown as Omit<ReportView, 'reporter_name' | 'target_label'>[]
  const ids = rows.flatMap((row) =>
    [row.reporter_id, row.reported_user_id].filter((id): id is string => Boolean(id)),
  )
  const names = await displayNameOf(ids)

  return {
    ok: true,
    data: rows.map((row) => ({
      ...row,
      reporter_name: names.get(row.reporter_id) ?? 'Desconocido',
      target_label:
        row.need?.title ??
        row.comment?.body.slice(0, 80) ??
        names.get(row.reported_user_id ?? '') ??
        '—',
    })),
    error: null,
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
): Promise<ModResult<null>> {
  const { error } = await supabase
    .from('reports')
    .update({ status, resolved_at: status === 'PENDING' ? null : new Date().toISOString() })
    .eq('id', reportId)
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos actualizar el reporte.'),
    }
  return { ok: true, data: null, error: null }
}

export async function deleteReport(reportId: string): Promise<ModResult<null>> {
  const { error } = await supabase.from('reports').delete().eq('id', reportId)
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos eliminar el reporte.'),
    }
  return { ok: true, data: null, error: null }
}

// ---------- Panel admin: necesidades ----------

export async function getAdminNeeds(): Promise<ModResult<AdminNeed[]>> {
  const { data, error } = await supabase
    .from('needs')
    .select('id, title, status, is_hidden, hidden_at, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_LIMIT)
  if (error) return { ok: false, data: null, error: 'No pudimos cargar los pedidos de ayuda.' }

  const rows = (data ?? []) as (AdminNeed & { user_id: string })[]
  const names = await displayNameOf(rows.map((row) => row.user_id))

  return {
    ok: true,
    data: rows.map(({ user_id, ...row }) => ({
      ...row,
      owner_name: names.get(user_id) ?? 'Desconocido',
    })),
    error: null,
  }
}

/** Oculta/restaura o cierra una necesidad desde el panel admin. */
export async function moderateNeed(
  needId: string,
  action: 'hide' | 'unhide' | 'close',
): Promise<ModResult<null>> {
  const payload =
    action === 'hide'
      ? { is_hidden: true, hidden_at: new Date().toISOString() }
      : action === 'unhide'
        ? { is_hidden: false, hidden_at: null }
        : { status: 'CLOSED' as const }
  const { error } = await supabase.from('needs').update(payload).eq('id', needId)
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos moderar el pedido de ayuda.'),
    }
  return { ok: true, data: null, error: null }
}

// ---------- Panel admin: comentarios ----------

/**
 * Comentarios del hilo para moderar (MVP §25). `onlyHidden` deja ver lo ya
 * ocultado, que por RLS solo alcanzan a ver su autor y los administradores.
 */
export async function getAdminComments(onlyHidden = false): Promise<ModResult<AdminComment[]>> {
  let query = supabase
    .from('need_comments')
    .select('id, need_id, body, is_hidden, hidden_at, created_at, user_id, need:needs(title)')
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_LIMIT)
  if (onlyHidden) query = query.eq('is_hidden', true)

  const { data, error } = await query
  if (error) return { ok: false, data: null, error: 'No pudimos cargar los comentarios.' }

  const rows = (data ?? []) as unknown as (Omit<AdminComment, 'author_name' | 'need_title'> & {
    user_id: string
    need: { title: string } | null
  })[]
  const names = await displayNameOf(rows.map((row) => row.user_id))

  return {
    ok: true,
    data: rows.map(({ user_id, need, ...row }) => ({
      ...row,
      author_name: names.get(user_id) ?? 'Desconocido',
      need_title: need?.title ?? null,
    })),
    error: null,
  }
}

/** Oculta o restaura un comentario (RLS: solo admin puede ocultar ajenos). */
export async function moderateComment(
  commentId: string,
  hidden: boolean,
): Promise<ModResult<null>> {
  const { error } = await supabase
    .from('need_comments')
    .update({ is_hidden: hidden, hidden_at: hidden ? new Date().toISOString() : null })
    .eq('id', commentId)
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos moderar el comentario.'),
    }
  return { ok: true, data: null, error: null }
}

// ---------- Panel admin: usuarios ----------

export async function getAdminUsers(
  search: string,
  municipalityId: number | null,
): Promise<ModResult<AdminUser[]>> {
  let query = supabase
    .from('profiles')
    .select(
      'id, display_name, municipality_id, app_role, banned_at, created_at, municipalities(name)',
    )
    .order('created_at', { ascending: false })
    .limit(ADMIN_LIST_LIMIT)
  const term = search.trim()
  if (term) query = query.ilike('display_name', `%${term}%`)
  if (municipalityId) query = query.eq('municipality_id', municipalityId)

  const { data, error } = await query
  if (error) return { ok: false, data: null, error: 'No pudimos cargar los usuarios.' }
  const rows = (data ?? []) as (Omit<AdminUser, 'municipalities'> & {
    municipalities: { name: string }[] | null
  })[]
  return {
    ok: true,
    data: rows.map(({ municipalities, ...row }) => ({
      ...row,
      municipalities: municipalities?.[0] ?? null,
    })),
    error: null,
  }
}

/** Suspende/restaura a un usuario (banned_at). El resto lo resuelve is_banned() en backend. */
export async function setUserSuspended(
  userId: string,
  suspended: boolean,
): Promise<ModResult<null>> {
  const { error } = await supabase
    .from('profiles')
    .update({ banned_at: suspended ? new Date().toISOString() : null })
    .eq('id', userId)
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos suspender al usuario.'),
    }
  return { ok: true, data: null, error: null }
}

// ---------- Panel admin: estadísticas ----------

export async function getAdminStats(): Promise<ModResult<AdminStats>> {
  const { data, error } = await supabase.rpc('admin_stats')
  if (error)
    return {
      ok: false,
      data: null,
      error: mapModerationError(error, 'No pudimos cargar las estadísticas.'),
    }
  return { ok: true, data: data as unknown as AdminStats, error: null }
}
