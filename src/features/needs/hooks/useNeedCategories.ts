import { useEffect, useState } from 'react'

import { getNeedCategories } from '@/features/needs/services/needService'
import type { NeedCategory } from '@/features/needs/types'

/** Catálogo de categorías para los filtros del listado público. */
export function useNeedCategories() {
  const [categories, setCategories] = useState<NeedCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getNeedCategories().then((result) => {
      if (!active) return
      if (!result.ok) {
        setError(result.error)
      } else {
        setCategories(result.data)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  return { categories, loading, error }
}
