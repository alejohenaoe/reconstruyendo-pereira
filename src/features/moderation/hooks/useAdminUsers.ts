import { useCallback, useEffect, useState } from 'react'

import { getAdminUsers } from '@/features/moderation/services/moderationService'
import type { AdminUser } from '@/features/moderation/types'

/** Usuarios del panel admin, con búsqueda por nombre y filtro de municipio. */
export function useAdminUsers(search: string, municipalityId: number | null) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    void getAdminUsers(search, municipalityId).then((result) => {
      if (!active) return
      if (result.ok) setUsers(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [search, municipalityId, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { users, loading, error, reload }
}
