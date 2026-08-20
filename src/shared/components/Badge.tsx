import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'neutral' | 'brand' | 'help'
}

const STYLES: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-closed-100 text-closed-600',
  brand: 'bg-brand-100 text-brand-700',
  help: 'bg-success-100 text-success-700',
}

/** Píldora de etiquetado (UX §30). Los estados de pedido usan NeedStatus. */
export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[variant]}`}
    >
      {children}
    </span>
  )
}
