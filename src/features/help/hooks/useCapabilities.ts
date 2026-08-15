import { useEffect, useState } from 'react'

import { getCapabilities } from '@/features/help/services/helpService'
import type { Capability } from '@/features/help/types'

/** Catálogo de capacidades para el formulario de oferta de ayuda. */
export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void getCapabilities().then((result) => {
      if (!active) return
      if (result.ok) setCapabilities(result.data)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { capabilities, loading }
}
