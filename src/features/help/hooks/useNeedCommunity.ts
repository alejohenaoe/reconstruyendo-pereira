import { useCallback, useEffect, useState } from 'react'

import { getComments, getOfferers } from '@/features/help/services/helpService'
import type { NeedComment, Offerer } from '@/features/help/types'

/** Ofertas + hilo de una necesidad, con una función para recargar tras cambios. */
export function useNeedCommunity(needId: string) {
  const [offerers, setOfferers] = useState<Offerer[]>([])
  const [comments, setComments] = useState<NeedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void Promise.all([getOfferers(needId), getComments(needId)]).then(([offers, thread]) => {
      if (!active) return
      if (!offers.ok) setError(offers.error)
      else if (!thread.ok) setError(thread.error)
      if (offers.ok) setOfferers(offers.data)
      if (thread.ok) setComments(thread.data)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [needId, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { offerers, comments, loading, error, reload }
}
