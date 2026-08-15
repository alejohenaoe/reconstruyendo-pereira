import { useCallback, useEffect, useState } from 'react'

import { getReports } from '@/features/moderation/services/moderationService'
import type { ReportView } from '@/features/moderation/types'

/** Reportes del panel admin, con recarga tras moderar. */
export function useReports() {
  const [reports, setReports] = useState<ReportView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getReports().then((result) => {
      if (!active) return
      if (result.ok) setReports(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { reports, loading, error, reload }
}
