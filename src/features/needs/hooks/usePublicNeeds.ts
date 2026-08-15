import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getNeedImages,
  getOfferCounts,
  getPublicNeeds,
  needImageOriginalUrl,
  needImageUrl,
} from '@/features/needs/services/needService'
import type { Need, NeedFilters, NeedsCursor } from '@/features/needs/types'

/**
 * Lista pública con filtros y paginación por cursor.
 * Los conteos e imágenes se cargan agrupados por página (sin N+1).
 */
export function usePublicNeeds(filters: NeedFilters) {
  const [needs, setNeeds] = useState<Need[]>([])
  const [images, setImages] = useState<Record<string, { thumb: string; original: string }>>({})
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const filtersRef = useRef(filters)
  const cursorRef = useRef<NeedsCursor | null>(null)
  const requestRef = useRef(0)
  const loadingMoreRef = useRef(false)

  function applyAssets(loadedNeeds: Need[]) {
    const ids = loadedNeeds.map((need) => need.id)
    if (ids.length === 0) {
      setImages({})
      setOfferCounts({})
      return
    }
    void Promise.all([getOfferCounts(ids), getNeedImages(ids)]).then(([counts, rows]) => {
      const countMap: Record<string, number> = {}
      for (const row of counts) countMap[row.need_id] = row.offer_count
      const imageMap: Record<string, { thumb: string; original: string }> = {}
      for (const row of rows) {
        if (!imageMap[row.need_id]) {
          imageMap[row.need_id] = {
            thumb: needImageUrl(row.storage_path, 160, 120),
            original: needImageOriginalUrl(row.storage_path),
          }
        }
      }
      setOfferCounts(countMap)
      setImages(imageMap)
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
      applyAssets(result.data.needs)
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
    applyAssets(result.data.needs)
  }, [])

  useEffect(() => {
    filtersRef.current = filters
    void reload()
    // Los filtros primitivos son la señal de cambio; el objeto `filters` se re-crea por render.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.municipalityId, filters.categoryId, filters.status, reload])

  return { needs, images, offerCounts, loading, loadingMore, error, hasMore, reload, loadMore }
}
