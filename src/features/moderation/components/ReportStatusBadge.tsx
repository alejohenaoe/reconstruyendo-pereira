import type { ReportStatus } from '@/features/moderation/types'
import { REPORT_STATUS_LABELS } from '@/features/moderation/types'

const CONFIG: Record<ReportStatus, string> = {
  PENDING: 'bg-warning-100 text-warning-700',
  REVIEWED: 'bg-info-100 text-info-700',
  ACTIONED: 'bg-success-100 text-success-700',
  DISMISSED: 'bg-closed-100 text-closed-600',
}

interface ReportStatusBadgeProps {
  status: ReportStatus
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CONFIG[status]}`}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  )
}
