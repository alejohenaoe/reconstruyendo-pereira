import { CheckCircle2, CircleOff, Clock, LifeBuoy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { NeedStatus as NeedStatusValue } from '@/features/needs/types'
import { NEED_STATUS_LABELS } from '@/features/needs/types'

const CONFIG: Record<NeedStatusValue, { classes: string; Icon: LucideIcon }> = {
  OPEN: { classes: 'bg-need-100 text-need-700', Icon: LifeBuoy },
  IN_PROGRESS: { classes: 'bg-progress-100 text-progress-700', Icon: Clock },
  RESOLVED: { classes: 'bg-success-100 text-success-700', Icon: CheckCircle2 },
  CLOSED: { classes: 'bg-closed-100 text-closed-600', Icon: CircleOff },
}

interface NeedStatusProps {
  status: NeedStatusValue
  size?: 'sm' | 'md'
}

export function NeedStatus({ status, size = 'md' }: NeedStatusProps) {
  const { classes, Icon } = CONFIG[status]
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium ${padding} ${classes}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {NEED_STATUS_LABELS[status]}
    </span>
  )
}
