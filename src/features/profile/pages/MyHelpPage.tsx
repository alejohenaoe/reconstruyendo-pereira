import { Link } from 'react-router-dom'

import { HandHeart } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { MyOfferCard } from '@/features/profile/components/MyOfferCard'
import { useMyOffers } from '@/features/profile/hooks/useMyOffers'
import {
  MY_OFFER_GROUP_LABELS,
  MY_OFFER_GROUP_ORDER,
  groupMyOffers,
} from '@/features/profile/types'
import { Alert } from '@/shared/components/Alert'
import { AppHeader } from '@/shared/components/AppHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { PageLoader } from '@/shared/components/PageLoader'
import { buttonStyles } from '@/shared/components/buttonStyles'

/** Historial de ayudas ofrecidas: pendientes, confirmadas y canceladas (MVP §24). */
export function MyHelpPage() {
  const { user } = useAuth()
  const { offers, loading, loadingMore, hasMore, error, loadMore } = useMyOffers(user?.id ?? null)

  const groups = groupMyOffers(offers)
  const confirmed = groups.confirmed.length

  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-brand-900 text-2xl font-semibold">Mis ayudas</h1>
        <p className="text-closed-500 mt-1 text-sm">
          {confirmed > 0
            ? `${confirmed} ${confirmed === 1 ? 'ayuda confirmada' : 'ayudas confirmadas'} por quien pidió ayuda.`
            : 'Aquí ves en qué punto va cada ayuda que ofreciste.'}
        </p>

        {error ? (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {loading ? (
          <PageLoader />
        ) : offers.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="Todavía no te has ofrecido a ayudar"
            description="Mira los pedidos de tu zona: puedes aportar trabajo, materiales, herramientas, transporte o conocimiento."
            action={
              <Link to="/needs" className={buttonStyles({ variant: 'primary', size: 'md' })}>
                Ver pedidos de ayuda
              </Link>
            }
          />
        ) : (
          <>
            {MY_OFFER_GROUP_ORDER.map((group) =>
              groups[group].length === 0 ? null : (
                <section key={group} className="mt-6">
                  <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
                    {MY_OFFER_GROUP_LABELS[group]}
                  </h2>
                  <ul className="mt-3 flex flex-col gap-3">
                    {groups[group].map((offer) => (
                      <MyOfferCard key={offer.id} offer={offer} />
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
