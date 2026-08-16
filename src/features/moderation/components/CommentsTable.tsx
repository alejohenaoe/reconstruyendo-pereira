import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EyeOff } from 'lucide-react'

import { moderateComment } from '@/features/moderation/services/moderationService'
import type { AdminComment } from '@/features/moderation/types'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

interface CommentsTableProps {
  comments: AdminComment[]
  onChanged: () => void
}

/** Comentarios del hilo en el panel admin: ocultar o restaurar (MVP §25). */
export function CommentsTable({ comments, onChanged }: CommentsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(comment: AdminComment) {
    const hiding = !comment.is_hidden
    if (hiding && !window.confirm('¿Ocultar este comentario? Dejará de verse en el hilo.')) return
    setBusyId(comment.id)
    setError(null)
    const result = await moderateComment(comment.id, hiding)
    setBusyId(null)
    if (!result.ok) setError(result.error)
    else onChanged()
  }

  if (comments.length === 0) {
    return <p className="text-closed-500 text-sm">No hay comentarios.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-danger-600 text-sm">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="border-arena-200 flex flex-col gap-2 rounded-lg border bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-closed-800 text-sm whitespace-pre-line">{comment.body}</p>
                <p className="text-closed-500 mt-1 text-xs">
                  {comment.author_name} · en{' '}
                  <Link to={`/needs/${comment.need_id}`} className="hover:text-brand-700 underline">
                    {comment.need_title ?? 'el pedido de ayuda'}
                  </Link>{' '}
                  · {timeAgo(comment.created_at)}
                  {comment.is_hidden ? (
                    <span className="text-danger-600 ml-1 inline-flex items-center gap-1 font-medium">
                      <EyeOff className="size-3" aria-hidden="true" />
                      Ocultado
                    </span>
                  ) : null}
                </p>
              </div>
              <Button
                size="sm"
                variant={comment.is_hidden ? 'secondary' : 'subtle'}
                loading={busyId === comment.id}
                onClick={() => void run(comment)}
              >
                {comment.is_hidden ? 'Restaurar' : 'Ocultar'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
