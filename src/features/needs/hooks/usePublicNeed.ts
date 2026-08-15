import { useCallback, useEffect, useState } from 'react'

import { getAuthorName, getNeedById, getNeedImages } from '@/features/needs/services/needService'
import type { Need, NeedImage } from '@/features/needs/types'

/**
 * Detalle público de una necesidad: datos + imágenes + autor.
 * Si la necesidad no es visible (RLS) o no existe, `code` es 'not_found'.
 */
export function usePublicNeed(id: string) {
  const [need, setNeed] = useState<Need | null>(null)
  const [images, setImages] = useState<NeedImage[]>([])
  const [authorName, setAuthorName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<'not_found' | 'unknown' | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setCode(null)

    void getNeedById(id).then(async (result) => {
      if (!active) return
      if (!result.ok) {
        setError(result.error)
        setCode(result.code)
        setLoading(false)
        return
      }

      const data = result.data
      const [rows, author] = await Promise.all([
        getNeedImages([data.id]),
        data.user_id ? getAuthorName(data.user_id) : Promise.resolve(null),
      ])
      if (!active) return

      setNeed(data)
      setImages(rows)
      setAuthorName(author)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [id, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { need, images, authorName, loading, error, code, reload }
}
