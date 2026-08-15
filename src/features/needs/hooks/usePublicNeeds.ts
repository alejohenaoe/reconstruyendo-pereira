import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getNeedImages,
  getOfferCounts,
  getPublicNeeds,
  needImageOriginalUrl,
  needImageUrl,
} from '@/features/needs/services/needService'
import type { Need, NeedFilters, NeedsCursor } from '@/features/needs/types'

type ImageMap = Record<string, { thumb: string; original: string }>

/**
 * Lista pública con filtros y paginación por cursor.
 * Los conteos e imágenes se cargan agrupados por página (sin N+1).
 */
export function usePublicNeeds(filters: NeedFilters) {
  const [needs, setNeeds] = useState<Need[]>([])
  const [images, setImages] = useState<ImageMap>({})
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const filtersRef = useRef(filters)
  const cursorRef = useRef<NeedsCursor | null>(null)
  const requestRef = useRef(0)
  const loadingMoreRef = useRef(false)

  /**
   * Miniaturas y conteos de una página, pedidos agrupados (sin N+1).
   * Una recarga reemplaza lo anterior; al paginar se acumula, porque si no
   * "Cargar más" dejaría sin miniatura ni conteo a las tarjetas ya cargadas.
   */
  function applyAssets(loadedNeeds: Need[], mode: 'replace' | 'append') {
    const ids = loadedNeeds.map((need) => need.id)
    if (ids.length === 0) {
      if (mode === 'replace') {
        setImages({})
        setOfferCounts({})
      }
      return
    }
    void Promise.all([getOfferCounts(ids), getNeedImages(ids)]).then(([counts, rows]) => {
      setOfferCounts((current) => {
        const next = mode === 'replace' ? {} : { ...current }
        for (const row of counts) next[row.need_id] = row.offer_count
        return next
      })
      setImages((current) => {
        const next: ImageMap = mode === 'replace' ? {} : { ...current }
        for (const row of rows) {
          if (next[row.need_id]) continue
          next[row.need_id] = {
            thumb: needImageUrl(row.storage_path, 160, 120),
            original: needImageOriginalUrl(row.storage_path),
          }
        }
        return next
      })
    })
  }

  const reload = useCallback(async () => {
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)

    const result = await getPublicNeeds(filtersRef.current, null)
    if (requestId !== requestRef.current) return

    if (!result.ok) {
      setNeeds([])
      setImages({})
      setOfferCounts({})
      setHasMore(false)
      cursorRef.current = null
      setError(result.error)
    } else {
      setNeeds(result.data.needs)
      setHasMore(result.data.hasMore)
      cursorRef.current = result.data.nextCursor
      applyAssets(result.data.needs, 'replace')
    }
    setLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)

    const result = await getPublicNeeds(filtersRef.current, cursorRef.current)
    loadingMoreRef.current = false
    setLoadingMore(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setNeeds((prev) => [...prev, ...result.data.needs])
    setHasMore(result.data.hasMore)
    cursorRef.current = result.data.nextCursor
    applyAssets(result.data.needs, 'append')
  }, [])

  useEffect(() => {
    filtersRef.current = filters
    void reload()
    // Los filtros primitivos son la señal de cambio; el objeto `filters` se re-crea por render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.municipalityId, filters.categoryId, filters.status, reload])

  return { needs, images, offerCounts, loading, loadingMore, error, hasMore, reload, loadMore }
}
