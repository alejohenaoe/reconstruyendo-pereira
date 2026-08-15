import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { HelpCircle, Plus } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMunicipalities } from '@/features/auth/hooks/useMunicipalities'
import { NeedCard } from '@/features/needs/components/NeedCard'
import { NeedFilters } from '@/features/needs/components/NeedFilters'
import { useNeedCategories } from '@/features/needs/hooks/useNeedCategories'
import { usePublicNeeds } from '@/features/needs/hooks/usePublicNeeds'
import type { NeedFilters as NeedFiltersValue, NeedStatus } from '@/features/needs/types'
import { NEED_STATUS_ORDER } from '@/features/needs/types'
import { AppHeader } from '@/shared/components/AppHeader'
import { EmptyState } from '@/shared/components/EmptyState'
import { Skeleton } from '@/shared/components/Skeleton'
import { buttonStyles } from '@/shared/components/buttonStyles'

/** Listado público de necesidades con filtros (municipio, categoría, estado). */
export function NeedsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status } = useAuth()
  const { municipalities } = useMunicipalities()
  const { categories } = useNeedCategories()

  const filters = useMemo<NeedFiltersValue>(() => {
    const municipalityId = parsePositiveInt(searchParams.get('municipality'))
    const categoryId = parsePositiveInt(searchParams.get('category'))
    const rawStatus = searchParams.get('status')
    const status = NEED_STATUS_ORDER.includes(rawStatus as NeedStatus)
      ? (rawStatus as NeedStatus)
      : null
    return { municipalityId, categoryId, status }
  }, [searchParams])

  const { needs, images, offerCounts, loading, loadingMore, error, hasMore, reload, loadMore } =
    usePublicNeeds(filters)

  const hasActiveFilters =
    filters.municipalityId !== null || filters.categoryId !== null || filters.status !== null

  function updateFilters(next: NeedFiltersValue) {
    const params = new URLSearchParams()
    if (next.municipalityId !== null) params.set('municipality', String(next.municipalityId))
    if (next.categoryId !== null) params.set('category', String(next.categoryId))
    if (next.status !== null) params.set('status', next.status)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <h1 className="text-brand-900 text-2xl font-semibold">Pedidos de ayuda</h1>
            <p className="text-closed-500 text-sm">
              Vecinos pidiendo ayuda para reconstruir sus viviendas tras el terremoto.
            </p>
          </div>
          {status === 'AUTHENTICATED' ? (
            <Link
              to="/needs/new"
              className={`${buttonStyles({ variant: 'primary', size: 'md' })} shrink-0`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Publicar
            </Link>
          ) : null}
        </div>

        <NeedFilters
          filters={filters}
          onChange={updateFilters}
          municipalities={municipalities}
          categories={categories}
        />

        {loading ? (
          <div
            className="mt-4 flex flex-col gap-3"
            role="status"
            aria-label="Cargando pedidos de ayuda"
          >
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : error ? (
          <EmptyState
            icon={HelpCircle}
            title="No pudimos cargar los pedidos de ayuda"
            description={error}
            action={
              <button
                type="button"
                onClick={() => void reload()}
                className={buttonStyles({ variant: 'secondary' })}
              >
                Reintentar
              </button>
            }
          />
        ) : needs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title={
              hasActiveFilters
                ? 'No encontramos pedidos de ayuda con estos filtros.'
                : 'Todavía no hay pedidos de ayuda publicados.'
            }
            description={
              hasActiveFilters
                ? 'Prueba con otros municipios, categorías o estados.'
                : 'El primero puede ser el tuyo: pide ayuda para reparar tu vivienda.'
            }
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ municipalityId: null, categoryId: null, status: null })
                  }
                  className={buttonStyles({ variant: 'subtle' })}
                >
                  Limpiar filtros
                </button>
              ) : null
            }
          />
        ) : (
          <>
            <ul className="mt-4 flex flex-col gap-3">
              {needs.map((need) => (
                <li key={need.id}>
                  <NeedCard
                    need={need}
                    offerCount={offerCounts[need.id] ?? 0}
                    image={images[need.id] ?? null}
                  />
                </li>
              ))}
            </ul>
            {hasMore ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className={`${buttonStyles({ variant: 'secondary', fullWidth: true })} mt-4`}
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

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
