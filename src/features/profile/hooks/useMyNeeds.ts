import { useCallback, useEffect, useState } from 'react'

import {
  getNeedImages,
  getNeedsByUser,
  getOfferCounts,
  needImageOriginalUrl,
  needImageUrl,
} from '@/features/needs/services/needService'
import type { Need, NeedsCursor } from '@/features/needs/types'

type ImageMap = Record<string, { thumb: string; original: string }>

/** Mis pedidos de ayuda, en todos sus estados, con paginación por cursor (MVP §24). */
export function useMyNeeds(userId: string | null) {
  const [needs, setNeeds] = useState<Need[]>([])
  const [images, setImages] = useState<ImageMap>({})
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<NeedsCursor | null>(null)

  // Las miniaturas y los conteos se piden agrupados por página (sin N+1) y se
  // acumulan, para que "Cargar más" no vacíe lo ya cargado.
  const addAssets = useCallback(async (page: Need[]) => {
    const ids = page.map((need) => need.id)
    if (ids.length === 0) return

    const [counts, rows] = await Promise.all([getOfferCounts(ids), getNeedImages(ids)])

    setOfferCounts((current) => {
      const next = { ...current }
      for (const row of counts) next[row.need_id] = row.offer_count
      return next
    })
    setImages((current) => {
      const next = { ...current }
      for (const row of rows) {
        if (next[row.need_id]) continue
        next[row.need_id] = {
          thumb: needImageUrl(row.storage_path, 160, 120),
          original: needImageOriginalUrl(row.storage_path),
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)
    setError(null)

    void getNeedsByUser(userId, null).then((result) => {
      if (!active) return
      if (!result.ok) {
        setNeeds([])
        setHasMore(false)
        setCursor(null)
        setError(result.error)
      } else {
        setNeeds(result.data.needs)
        setHasMore(result.data.hasMore)
        setCursor(result.data.nextCursor)
        void addAssets(result.data.needs)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [userId, addAssets])

  const loadMore = useCallback(async () => {
    if (!userId || !cursor || loadingMore) return
    setLoadingMore(true)
    const result = await getNeedsByUser(userId, cursor)
    setLoadingMore(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setNeeds((current) => [...current, ...result.data.needs])
    setHasMore(result.data.hasMore)
    setCursor(result.data.nextCursor)
    void addAssets(result.data.needs)
  }, [userId, cursor, loadingMore, addAssets])

  return { needs, images, offerCounts, loading, loadingMore, hasMore, error, loadMore }
}
