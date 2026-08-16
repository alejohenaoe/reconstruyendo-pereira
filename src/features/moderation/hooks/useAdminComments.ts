import { useCallback, useEffect, useState } from 'react'

import { getAdminComments } from '@/features/moderation/services/moderationService'
import type { AdminComment } from '@/features/moderation/types'

/** Comentarios del hilo para moderar; `onlyHidden` filtra los ya ocultados. */
export function useAdminComments(onlyHidden: boolean) {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getAdminComments(onlyHidden).then((result) => {
      if (!active) return
      if (result.ok) setComments(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [onlyHidden, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { comments, loading, error, reload }
}
