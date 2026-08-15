import { Link } from 'react-router-dom'

import { AdminStatsCards } from '@/features/moderation/components/AdminStatsCards'
import { useAdminStats } from '@/features/moderation/hooks/useAdminStats'
import { PageLoader } from '@/shared/components/PageLoader'

export function AdminDashboardPage() {
  const { stats, loading, error } = useAdminStats()

  if (loading) return <PageLoader />

  return (
    <>
      <div>
        <h1 className="text-brand-900 text-xl font-semibold">Resumen</h1>
        <p className="text-closed-500 mt-1 text-sm">Estado general de la comunidad.</p>
      </div>
      {error ? <p className="text-danger-600 text-sm">{error}</p> : <AdminStatsCards stats={stats} />}
      <div>
        <Link to="/admin/reports" className="text-brand-700 text-sm font-medium hover:underline">
          Ver reportes pendientes →
        </Link>
      </div>
    </>
  )
}
