import { describe, expect, it } from 'vitest'

import type { AppNotification, NotificationPayload } from '@/features/notifications/types'
import { notificationMessage } from '@/features/notifications/types'

function notification(
  type: AppNotification['type'],
  payload: NotificationPayload,
): AppNotification {
  return {
    id: 'id-1',
    user_id: 'user-1',
    type,
    actor_id: 'actor-1',
    need_id: 'need-1',
    payload,
    read_at: null,
    created_at: '2026-08-15T00:00:00Z',
  }
}

describe('notificationMessage', () => {
  it('describe una oferta de ayuda al dueño', () => {
    const message = notificationMessage(
      notification('HELP_OFFER', { title: 'Reparar techo', actor_name: 'Juan' }),
    )
    expect(message).toBe('Juan se ofreció a ayudarte en «Reparar techo».')
  })

  it('describe un comentario al dueño', () => {
    const message = notificationMessage(
      notification('COMMENT', { title: 'Reparar techo', actor_name: 'Ana' }),
    )
    expect(message).toBe('Ana comentó en «Reparar techo».')
  })

  it('describe una ayuda confirmada al oferente', () => {
    const message = notificationMessage(
      notification('HELP_CONFIRMED', { title: 'Reparar techo', actor_name: 'María' }),
    )
    expect(message).toBe('María confirmó tu ayuda en «Reparar techo».')
  })

  it('describe un cambio de estado incluyendo el estado', () => {
    const message = notificationMessage(
      notification('NEED_STATUS_CHANGE', {
        title: 'Reparar techo',
        actor_name: 'María',
        status: 'IN_PROGRESS',
      }),
    )
    expect(message).toBe('María actualizó el estado de «Reparar techo» (IN_PROGRESS).')
  })

  it('cae a "tu pedido de ayuda" cuando no hay título', () => {
    const message = notificationMessage(notification('COMMENT', { title: '', actor_name: 'Ana' }))
    expect(message).toBe('Ana comentó en tu pedido de ayuda.')
  })

  it('usa "Alguien" cuando falta el nombre del actor', () => {
    const message = notificationMessage(
      notification('HELP_OFFER', { title: 'Reparar techo', actor_name: '' }),
    )
    expect(message).toBe('Alguien se ofreció a ayudarte en «Reparar techo».')
  })
})
