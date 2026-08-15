import { useCallback, useEffect, useState } from 'react'

import { listMyOffers } from '@/features/profile/services/profileService'
import type { MyOffer, MyOffersCursor } from '@/features/profile/types'

/** Mis ofertas de ayuda con paginación por cursor (MVP §24). */
export function useMyOffers(userId: string | null) {
  const [offers, setOffers] = useState<MyOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<MyOffersCursor | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)
    setError(null)

    void listMyOffers(userId, null).then((result) => {
      if (!active) return
      if (!result.ok) {
        setOffers([])
        setHasMore(false)
        setCursor(null)
        setError(result.error)
      } else {
        setOffers(result.data.offers)
        setHasMore(result.data.hasMore)
        setCursor(result.data.nextCursor)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [userId])

  const loadMore = useCallback(async () => {
    if (!userId || !cursor || loadingMore) return
    setLoadingMore(true)
    const result = await listMyOffers(userId, cursor)
    setLoadingMore(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setOffers((current) => [...current, ...result.data.offers])
    setHasMore(result.data.hasMore)
    setCursor(result.data.nextCursor)
  }, [userId, cursor, loadingMore])

  return { offers, loading, loadingMore, hasMore, error, loadMore }
}
