import { useCallback, useEffect, useState } from 'react'

import { getAdminNeeds } from '@/features/moderation/services/moderationService'
import type { AdminNeed } from '@/features/moderation/types'

/** Necesidades del panel admin (incluye ocultas y cerradas), con recarga. */
export function useAdminNeeds() {
  const [needs, setNeeds] = useState<AdminNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getAdminNeeds().then((result) => {
      if (!active) return
      if (result.ok) setNeeds(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { needs, loading, error, reload }
}
