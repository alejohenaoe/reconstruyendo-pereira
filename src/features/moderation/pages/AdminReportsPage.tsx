import { ReportsTable } from '@/features/moderation/components/ReportsTable'
import { useReports } from '@/features/moderation/hooks/useReports'
import { PageLoader } from '@/shared/components/PageLoader'

export function AdminReportsPage() {
  const { reports, loading, error, reload } = useReports()

  if (loading) return <PageLoader />

  return (
    <>
      <div>
        <h1 className="text-brand-900 text-xl font-semibold">Reportes</h1>
        <p className="text-closed-500 mt-1 text-sm">
          Revisa, atiende o descarta los reportes de la comunidad.
        </p>
      </div>
      {error ? (
        <p className="text-danger-600 text-sm">{error}</p>
      ) : (
        <ReportsTable reports={reports} onChanged={() => void reload()} />
      )}
    </>
  )
}
