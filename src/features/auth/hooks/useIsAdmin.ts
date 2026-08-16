import { useEffect, useState } from 'react'

import { supabase } from '@/shared/lib/supabase'

/**
 * ¿Es el usuario un administrador? (rol consultado en `profiles`, ARCH §36).
 * Devuelve `null` mientras se carga. La protección real es RLS; esto es solo UX.
 */
export function useIsAdmin(userId: string | null): boolean | null {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false)
      return
    }
    let active = true
    void (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('app_role')
          .eq('id', userId)
          .maybeSingle()
        if (active) setIsAdmin(data?.app_role === 'ADMIN')
      } catch {
        if (active) setIsAdmin(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  return isAdmin
}
