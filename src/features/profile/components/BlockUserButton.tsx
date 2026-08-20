import { useState } from 'react'

import { UserX } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { blockUser } from '@/features/profile/services/blockService'

interface BlockUserButtonProps {
  userId: string
  displayName: string
  /** Se llama tras bloquear, para recargar lo que ya no debe verse. */
  onBlocked: () => void
}

/**
 * Bloquear a una persona (MVP §21). A diferencia de reportar, esto no lo decide
 * la moderación: surte efecto de inmediato y solo entre estas dos personas.
 */
export function BlockUserButton({ userId, displayName, onBlocked }: BlockUserButtonProps) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.id === userId) return null

  async function handleBlock() {
    if (!user) return
    const confirmed = window.confirm(
      `¿Bloquear a ${displayName}? Dejarán de verse en los pedidos de ayuda y no podrán contactarse. Puedes deshacerlo desde Mi cuenta.`,
    )
    if (!confirmed) return

    setBusy(true)
    setError(null)
    const result = await blockUser(user.id, userId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onBlocked()
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleBlock()}
        className="text-closed-400 hover:text-danger-600 inline-flex items-center gap-1 text-xs underline disabled:opacity-60"
      >
        <UserX className="size-3" aria-hidden="true" />
        {busy ? 'Bloqueando…' : 'Bloquear'}
      </button>
      {error ? <span className="text-danger-600 text-xs">{error}</span> : null}
    </>
  )
}
