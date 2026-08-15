import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Eleva la tarjeta al pasar el cursor (listados enlazados). */
  interactive?: boolean
}

/** Superficie base del sistema de diseño (UX §30): borde arena, esquinas y sombra suaves. */
export function Card({ interactive = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`border-arena-200 rounded-xl border bg-white shadow-sm ${
        interactive ? 'transition-shadow hover:shadow-lg' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
