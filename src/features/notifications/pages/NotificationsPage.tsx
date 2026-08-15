import { NotificationItem } from '@/features/notifications/components/NotificationItem'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { AppHeader } from '@/shared/components/AppHeader'
import { buttonStyles } from '@/shared/components/buttonStyles'
import { PageLoader } from '@/shared/components/PageLoader'

/** Bandeja de notificaciones (Fase 7): lista, leído/no leído, paginación. */
export function NotificationsPage() {
  const {
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
  } = useNotifications()

  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-closed-800 text-xl font-semibold">Notificaciones</h1>
            <p className="text-closed-500 mt-1 text-sm">
              {unread > 0
                ? `Tienes ${unread} ${unread === 1 ? 'notificación' : 'notificaciones'} por leer.`
                : 'Estás al día.'}
            </p>
          </div>
          {unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className={buttonStyles({ variant: 'subtle', size: 'sm' })}
            >
              Marcar todo como leído
            </button>
          ) : null}
        </div>

        {error ? <p className="text-danger-600 mb-4 text-sm">{error}</p> : null}

        {loading ? (
          <PageLoader />
        ) : notifications.length === 0 ? (
          <p className="text-closed-500 text-sm">No tienes notificaciones.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markRead}
                  onDelete={remove}
                />
              ))}
            </ul>
            {hasMore ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className={`${buttonStyles({ variant: 'secondary', size: 'md' })} mt-4 w-full`}
              >
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            ) : (
              <p className="text-closed-400 mt-4 text-center text-xs">
                <button type="button" onClick={() => void reload()} className="hover:underline">
                  Actualizar
                </button>
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
