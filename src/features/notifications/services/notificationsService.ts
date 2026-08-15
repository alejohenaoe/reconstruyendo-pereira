import type {
  AppNotification,
  NotificationCursor,
  NotificationsPage,
  NotificationsResult,
} from '@/features/notifications/types'
import { supabase } from '@/shared/lib/supabase'

export const NOTIFICATIONS_PAGE_SIZE = 20

const NOTIFICATION_SELECT = 'id,user_id,type,actor_id,need_id,payload,read_at,created_at'

/**
 * Bandeja paginada por cursor (created_at desc, id desc).
 * Se piden PAGE_SIZE+1 filas para detectar si hay más sin un COUNT.
 */
export async function listNotifications(
  cursor: NotificationCursor | null,
): Promise<NotificationsResult<NotificationsPage>> {
  let query = supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(NOTIFICATIONS_PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `and(created_at.lt.${cursor.createdAt}),and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) return { ok: false, data: null, error: 'No pudimos cargar las notificaciones.' }

  const rows = (data ?? []) as unknown as AppNotification[]
  const hasMore = rows.length > NOTIFICATIONS_PAGE_SIZE
  const notifications = hasMore ? rows.slice(0, NOTIFICATIONS_PAGE_SIZE) : rows
  const last = notifications[notifications.length - 1] ?? null

  return {
    ok: true,
    data: {
      notifications,
      hasMore,
      nextCursor: hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
    },
    error: null,
  }
}

/** Contador de no leídas para el badge de la cabecera (usa el índice parcial). */
export async function getUnreadCount(): Promise<NotificationsResult<number>> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
  if (error) return { ok: false, data: null, error: 'No pudimos contar las notificaciones.' }
  return { ok: true, data: count ?? 0, error: null }
}

export async function markNotificationRead(id: string): Promise<NotificationsResult<null>> {
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
  if (error) return { ok: false, data: null, error: 'No pudimos marcar la notificación como leída.' }
  return { ok: true, data: null, error: null }
}

export async function markAllNotificationsRead(): Promise<NotificationsResult<null>> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) return { ok: false, data: null, error: 'No pudimos marcar las notificaciones como leídas.' }
  return { ok: true, data: null, error: null }
}

export async function deleteNotification(id: string): Promise<NotificationsResult<null>> {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) return { ok: false, data: null, error: 'No pudimos eliminar la notificación.' }
  return { ok: true, data: null, error: null }
}
