import { useCallback, useEffect, useState } from 'react'

import type { AppNotification, NotificationCursor } from '@/features/notifications/types'
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/services/notificationsService'

/** Bandeja con paginación por cursor + contador de no leídas (Fase 7). */
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<NotificationCursor | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void Promise.all([listNotifications(null), getUnreadCount()]).then(([page, count]) => {
      if (!active) return
      if (page.ok) {
        setNotifications(page.data.notifications)
        setHasMore(page.data.hasMore)
        setCursor(page.data.nextCursor)
      } else {
        setError(page.error)
      }
      if (count.ok) setUnread(count.data)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    const page = await listNotifications(cursor)
    setLoadingMore(false)
    if (page.ok) {
      setNotifications((current) => [...current, ...page.data.notifications])
      setHasMore(page.data.hasMore)
      setCursor(page.data.nextCursor)
    }
  }, [cursor, loadingMore])

  const markRead = useCallback(async (id: string) => {
    const result = await markNotificationRead(id)
    if (!result.ok) return false
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    )
    setUnread((count) => Math.max(0, count - 1))
    return true
  }, [])

  const markAllRead = useCallback(async () => {
    const result = await markAllNotificationsRead()
    if (!result.ok) return false
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
    )
    setUnread(0)
    return true
  }, [])

  const remove = useCallback(async (id: string) => {
    const result = await deleteNotification(id)
    if (!result.ok) return false
    setNotifications((current) => current.filter((notification) => notification.id !== id))
    return true
  }, [])

  return {
    notifications,
    unread,
    loading,
    loadingMore,
    hasMore,
    error,
    reload,
    loadMore,
    markRead,
    markAllRead,
    remove,
  }
}

/** Contador de no leídas para la cabecera (se refresca a petición). */
export function useUnreadCount() {
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(() => {
    void getUnreadCount().then((result) => {
      if (result.ok) setUnread(result.data)
    })
  }, [])

  useEffect(refresh, [refresh])

  return { unread, refresh }
}
