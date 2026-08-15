import { Link } from 'react-router-dom'

import type { AppNotification } from '@/features/notifications/types'
import { notificationMessage } from '@/features/notifications/types'
import { buttonStyles } from '@/shared/components/buttonStyles'
import { timeAgo } from '@/shared/utils/timeAgo'

interface NotificationItemProps {
  notification: AppNotification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}

/** Fila de la bandeja: punto de no leída, mensaje, fecha y acciones. */
export function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const isUnread = notification.read_at === null

  return (
    <li
      className={`rounded-md border p-4 ${isUnread ? 'border-brand-200 bg-brand-50/50' : 'border-closed-100 bg-white'}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-1.5 size-2 shrink-0 rounded-full ${isUnread ? 'bg-brand-600' : 'bg-closed-200'}`}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-closed-700 text-sm ${isUnread ? 'font-medium' : ''}`}>{notificationMessage(notification)}</p>
          <p className="text-closed-400 mt-0.5 text-xs">{timeAgo(notification.created_at)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isUnread ? (
            <button type="button" onClick={() => void onRead(notification.id)} className="text-brand-700 text-xs font-medium hover:underline">
              Marcar leída
            </button>
          ) : null}
          {notification.need_id ? (
            <Link
              to={`/needs/${notification.need_id}`}
              className={buttonStyles({ variant: 'subtle', size: 'sm' })}
              onClick={() => void onRead(notification.id)}
            >
              Ver
            </Link>
          ) : null}
          <button type="button" onClick={() => void onDelete(notification.id)} className="text-closed-400 hover:text-closed-700 text-xs hover:underline">
            Eliminar
          </button>
        </div>
      </div>
    </li>
  )
}
