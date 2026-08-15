import { useSearchParams } from 'react-router-dom'

/**
 * Lee el parámetro `redirect` (intención original, UX §21) y lo valida.
 * Solo se aceptan rutas internas que empiecen por `/` para evitar open redirect.
 */
export function useRedirectParam(): string | null {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  return redirect !== null && redirect.startsWith('/') ? redirect : null
}
