import { useCallback, useEffect, useState } from 'react'

import { getAdminStats } from '@/features/moderation/services/moderationService'
import type { AdminStats } from '@/features/moderation/types'

/** Estadísticas del panel admin. */
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getAdminStats().then((result) => {
      if (!active) return
      if (result.ok) setStats(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { stats, loading, error, reload }
}
