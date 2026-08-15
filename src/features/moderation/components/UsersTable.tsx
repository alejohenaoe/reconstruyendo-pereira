import { useState } from 'react'

import { setUserSuspended } from '@/features/moderation/services/moderationService'
import type { AdminUser } from '@/features/moderation/types'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

interface UsersTableProps {
  users: AdminUser[]
  onChanged: () => void
}

/** Usuarios del panel admin: suspender/restaurar (banned_at). */
export function UsersTable({ users, onChanged }: UsersTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleSuspend(user: AdminUser) {
    const suspending = !user.banned_at
    if (suspending && !window.confirm(`¿Suspender a ${user.display_name}? Ya no podrá publicar ni participar.`)) {
      return
    }
    setBusyId(user.id)
    setError(null)
    const result = await setUserSuspended(user.id, suspending)
    setBusyId(null)
    if (!result.ok) setError(result.error)
    else onChanged()
  }

  if (users.length === 0) {
    return <p className="text-closed-500 text-sm">No encontramos usuarios con esos criterios.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-danger-600 text-sm">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <li key={user.id} className="border-closed-100 flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
            <div className="min-w-0">
              <p className="text-closed-800 truncate text-sm">
                <span className="font-medium">{user.display_name}</span>
                {user.app_role === 'ADMIN' ? <span className="text-brand-700 ml-2 text-xs font-semibold">ADMIN</span> : null}
                {user.banned_at ? <span className="text-danger-600 ml-2 text-xs font-semibold">Suspendido</span> : null}
              </p>
              <p className="text-closed-500 truncate text-xs">
                {user.municipalities?.name ?? 'Sin municipio'} · registrado {timeAgo(user.created_at)}
              </p>
            </div>
            {user.app_role === 'USER' ? (
              <Button
                size="sm"
                variant={user.banned_at ? 'secondary' : 'danger'}
                loading={busyId === user.id}
                onClick={() => void toggleSuspend(user)}
              >
                {user.banned_at ? 'Restaurar' : 'Suspender'}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
