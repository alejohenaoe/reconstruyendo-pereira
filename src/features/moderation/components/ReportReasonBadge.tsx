import type { ReportReason } from '@/features/moderation/types'
import { REPORT_REASON_LABELS } from '@/features/moderation/types'

const CONFIG: Record<ReportReason, string> = {
  SUSPICIOUS: 'bg-warning-100 text-warning-700',
  FALSE_INFO: 'bg-warning-100 text-warning-700',
  SPAM: 'bg-closed-100 text-closed-600',
  OFFENSIVE: 'bg-danger-100 text-danger-700',
  FRAUD: 'bg-danger-100 text-danger-700',
  MONEY_REQUEST: 'bg-danger-100 text-danger-700',
  OTHER: 'bg-closed-100 text-closed-600',
}

interface ReportReasonBadgeProps {
  reason: ReportReason
}

export function ReportReasonBadge({ reason }: ReportReasonBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CONFIG[reason]}`}
    >
      {REPORT_REASON_LABELS[reason]}
    </span>
  )
}
