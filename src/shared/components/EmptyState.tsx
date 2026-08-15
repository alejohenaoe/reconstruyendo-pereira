import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

/** Estado vacío amable y accionable (UX §24). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="bg-arena-100 flex size-12 items-center justify-center rounded-full">
        <Icon className="text-closed-500 size-6" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-closed-700 text-base font-semibold">{title}</h2>
        {description ? <p className="text-closed-500 mt-1 text-sm">{description}</p> : null}
      </div>
      {action ?? null}
    </div>
  )
}
