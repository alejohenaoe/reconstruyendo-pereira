interface SkeletonProps {
  className?: string
}

/** Esqueleto de carga con pulso sutil (UX §23). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`bg-arena-200 animate-pulse rounded-md ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}
