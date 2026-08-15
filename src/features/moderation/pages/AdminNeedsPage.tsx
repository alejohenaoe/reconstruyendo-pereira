import { NeedsTable } from '@/features/moderation/components/NeedsTable'
import { useAdminNeeds } from '@/features/moderation/hooks/useAdminNeeds'
import { PageLoader } from '@/shared/components/PageLoader'

export function AdminNeedsPage() {
  const { needs, loading, error, reload } = useAdminNeeds()

  if (loading) return <PageLoader />

  return (
    <>
      <div>
        <h1 className="text-closed-800 text-xl font-semibold">Necesidades</h1>
        <p className="text-closed-500 mt-1 text-sm">Oculta o cierra necesidades cuando la moderación lo indique.</p>
      </div>
      {error ? <p className="text-danger-600 text-sm">{error}</p> : <NeedsTable needs={needs} onChanged={() => void reload()} />}
    </>
  )
}
