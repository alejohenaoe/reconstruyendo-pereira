import { useState } from 'react'

import { ReportReasonBadge } from '@/features/moderation/components/ReportReasonBadge'
import { ReportStatusBadge } from '@/features/moderation/components/ReportStatusBadge'
import { deleteReport, updateReportStatus } from '@/features/moderation/services/moderationService'
import type { ReportStatus, ReportView } from '@/features/moderation/types'
import { REPORT_STATUSES, REPORT_STATUS_LABELS } from '@/features/moderation/types'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

interface ReportsTableProps {
  reports: ReportView[]
  onChanged: () => void
}

/** Tabla de reportes para moderar: cambiar estado o descartar/eliminar. */
export function ReportsTable({ reports, onChanged }: ReportsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changeStatus(id: string, status: ReportStatus) {
    setBusyId(id)
    setError(null)
    const result = await updateReportStatus(id, status)
    setBusyId(null)
    if (!result.ok) setError(result.error)
    else onChanged()
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este reporte definitivamente?')) return
    setBusyId(id)
    setError(null)
    const result = await deleteReport(id)
    setBusyId(null)
    if (!result.ok) setError(result.error)
    else onChanged()
  }

  if (reports.length === 0) {
    return <p className="text-closed-500 text-sm">No hay reportes.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-danger-600 text-sm">{error}</p> : null}
      <ul className="flex flex-col gap-3">
        {reports.map((report) => (
          <li key={report.id} className="border-closed-100 flex flex-col gap-2 rounded-md border bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <ReportStatusBadge status={report.status} />
              <ReportReasonBadge reason={report.reason} />
              <span className="text-closed-400 text-xs">· {timeAgo(report.created_at)}</span>
            </div>

            <p className="text-closed-800 text-sm font-medium">{report.target_label}</p>
            <p className="text-closed-500 text-sm">
              Reportado por <span className="font-medium">{report.reporter_name}</span>
              {report.details ? ` — ${report.details}` : ''}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {REPORT_STATUSES.filter((status) => status !== report.status).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="secondary"
                  loading={busyId === report.id}
                  onClick={() => void changeStatus(report.id, status)}
                >
                  {REPORT_STATUS_LABELS[status]}
                </Button>
              ))}
              <Button size="sm" variant="subtle" onClick={() => void handleDelete(report.id)}>
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
