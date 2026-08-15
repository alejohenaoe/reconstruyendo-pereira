import { useEffect, useState } from 'react'

import { getMunicipalities } from '@/features/auth/services/authService'
import type { Municipality } from '@/features/auth/types'

/** Municipios para el registro (tabla public.municipalities, RLS de lectura pública). */
export function useMunicipalities() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getMunicipalities().then((result) => {
      if (!active) return
      if (result.error) {
        setError(result.error)
      } else {
        setMunicipalities(result.data ?? [])
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  return { municipalities, loading, error }
}
