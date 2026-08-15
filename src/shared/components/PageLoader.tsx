import { Spinner } from '@/shared/components/Spinner'

/** Carga de página completa, evita parpadeos de rutas protegidas (ARCHITECTURE_GUIDELINES.md §8). */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center" role="status" aria-label="Cargando">
      <Spinner className="text-brand-600 size-8" />
    </div>
  )
}
