import { useCallback, useEffect, useState } from 'react'

import { listMyBlocks, unblockUser } from '@/features/profile/services/blockService'
import type { BlockedPerson } from '@/features/profile/types'

/** Personas que bloqueé, con la acción de desbloquear (MVP §21). */
export function useMyBlocks(userId: string | null) {
  const [blocks, setBlocks] = useState<BlockedPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!userId) return
    let active = true
    setLoading(true)

    void listMyBlocks(userId).then((result) => {
      if (!active) return
      if (result.ok) setBlocks(result.data)
      else setError(result.error)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [userId, reloadKey])

  const unblock = useCallback(
    async (blockedId: string) => {
      if (!userId) return
      const result = await unblockUser(userId, blockedId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setReloadKey((key) => key + 1)
    },
    [userId],
  )

  return { blocks, loading, error, unblock }
}
