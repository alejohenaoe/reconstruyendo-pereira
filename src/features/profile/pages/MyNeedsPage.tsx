import { Link } from 'react-router-dom'

import { HeartHandshake, Plus } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { NeedCard } from '@/features/needs/components/NeedCard'
import { useMyNeeds } from '@/features/profile/hooks/useMyNeeds'
import { MY_NEED_GROUP_LABELS, MY_NEED_GROUP_ORDER, groupMyNeeds } from '@/features/profile/types'
import { Alert } from '@/shared/components/Alert'
import { AppHeader } from '@/shared/components/AppHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageLoader } from '@/shared/components/PageLoader'
import { buttonStyles } from '@/shared/components/buttonStyles'

/** Historial de pedidos propios: actual, solucionados y cerrados (MVP §24). */
export function MyNeedsPage() {
  const { user } = useAuth()
  const { needs, images, offerCounts, loading, loadingMore, hasMore, error, loadMore } = useMyNeeds(
    user?.id ?? null,
  )

  const groups = groupMyNeeds(needs)
  const hasActive = groups.active.length > 0

  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-brand-900 text-2xl font-semibold">Mis pedidos de ayuda</h1>
            <p className="text-closed-500 mt-1 text-sm">
              Puedes tener un pedido activo a la vez. Al solucionarlo o cerrarlo, puedes publicar
              otro.
            </p>
          </div>
          {!loading && !hasActive ? (
            <Link to="/needs/new" className={buttonStyles({ variant: 'primary', size: 'md' })}>
              <Plus className="size-4" aria-hidden="true" />
              Publicar
            </Link>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {loading ? (
          <PageLoader />
        ) : needs.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="Todavía no has publicado un pedido de ayuda"
            description="Si el terremoto dañó tu casa, cuéntanos qué necesitas y la comunidad podrá ayudarte."
            action={
              <Link to="/needs/new" className={buttonStyles({ variant: 'primary', size: 'md' })}>
                <Plus className="size-4" aria-hidden="true" />
                Publicar pedido de ayuda
              </Link>
            }
          />
        ) : (
          <>
            {MY_NEED_GROUP_ORDER.map((group) =>
              groups[group].length === 0 ? null : (
                <section key={group} className="mt-6">
                  <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
                    {MY_NEED_GROUP_LABELS[group]}
                  </h2>
                  <ul className="mt-3 flex flex-col gap-3">
                    {groups[group].map((need) => (
                      <li key={need.id}>
                        <NeedCard
                          need={need}
                          offerCount={offerCounts[need.id] ?? 0}
                          image={images[need.id] ?? null}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}

            {hasMore ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className={`${buttonStyles({ variant: 'secondary', size: 'md' })} mt-6 w-full`}
              >
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
