/** Tipos de notificación in-app (public.notification_type). */
export type NotificationType = 'HELP_OFFER' | 'COMMENT' | 'HELP_CONFIRMED' | 'NEED_STATUS_CHANGE'

/** Payload que arman los triggers en backend (título + nombre del actor). */
export interface NotificationPayload {
  title: string
  actor_name: string
  status?: string
  /** Tipo de mensaje del hilo, solo en notificaciones COMMENT (MVP §14, §27). */
  kind?: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  actor_id: string | null
  need_id: string | null
  payload: NotificationPayload
  read_at: string | null
  created_at: string
}

/** Clave de paginación por cursor (created_at, id). */
export interface NotificationCursor {
  createdAt: string
  id: string
}

export interface NotificationsPage {
  notifications: AppNotification[]
  hasMore: boolean
  nextCursor: NotificationCursor | null
}

export type NotificationsResult<T> =
  { ok: true; data: T; error: null } | { ok: false; data: null; error: string }

/** Mensaje humano de una notificación (UX §23: texto claro, sin códigos). */
export function notificationMessage(notification: AppNotification): string {
  const actor = notification.payload.actor_name || 'Alguien'
  const title = notification.payload.title
    ? `«${notification.payload.title}»`
    : 'tu pedido de ayuda'
  switch (notification.type) {
    case 'HELP_OFFER':
      return `${actor} se ofreció a ayudarte en ${title}.`
    case 'COMMENT': {
      // MVP §27 pide distinguir el aviso de materiales del comentario normal.
      if (notification.payload.kind === 'MATERIAL') {
        return `${actor} ofreció materiales en ${title}.`
      }
      if (notification.payload.kind === 'RECOMMENDATION') {
        return `${actor} dejó una recomendación en ${title}.`
      }
      return `${actor} comentó en ${title}.`
    }
    case 'HELP_CONFIRMED':
      return `${actor} confirmó tu ayuda en ${title}.`
    case 'NEED_STATUS_CHANGE': {
      const status = notification.payload.status
      const suffix = status ? ` (${status})` : ''
      return `${actor} actualizó el estado de ${title}${suffix}.`
    }
  }
}
