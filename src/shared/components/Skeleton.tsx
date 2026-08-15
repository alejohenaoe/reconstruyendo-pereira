interface SkeletonProps {
  className?: string
}

/** Esqueleto de carga con pulso sutil (UX §23). */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-closed-100 ${className ?? ''}`} aria-hidden="true" />
}
