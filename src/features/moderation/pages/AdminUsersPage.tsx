import { useEffect, useState } from 'react'

import { useAdminUsers } from '@/features/moderation/hooks/useAdminUsers'
import { UsersTable } from '@/features/moderation/components/UsersTable'
import { useMunicipalities } from '@/features/auth/hooks/useMunicipalities'
import { TextField } from '@/shared/components/TextField'
import { PageLoader } from '@/shared/components/PageLoader'

const selectClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export function AdminUsersPage() {
  const { municipalities } = useMunicipalities()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [municipalityId, setMunicipalityId] = useState<number | null>(null)
  const { users, loading, error, reload } = useAdminUsers(debounced, municipalityId)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  if (loading) return <PageLoader />

  return (
    <>
      <div>
        <h1 className="text-brand-900 text-xl font-semibold">Usuarios</h1>
        <p className="text-closed-500 mt-1 text-sm">Busca, filtra y suspende usuarios según lo resuelva la moderación.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <TextField
          label="Buscar"
          name="user-search"
          placeholder="Nombre del usuario"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 sm:w-56">
          <span className="text-closed-700 text-sm font-medium">Municipio</span>
          <select
            name="municipality"
            className={selectClass}
            value={municipalityId ?? ''}
            onChange={(event) => setMunicipalityId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Todos</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="text-danger-600 text-sm">{error}</p> : <UsersTable users={users} onChanged={() => void reload()} />}
    </>
  )
}
