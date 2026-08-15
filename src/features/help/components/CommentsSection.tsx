import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { MessageCircle } from 'lucide-react'

import { addComment } from '@/features/help/services/helpService'
import type { NeedComment } from '@/features/help/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

const textareaClass =
  'w-full rounded-md border border-arena-200 bg-white px-3 py-2 text-sm text-closed-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-arena-100 disabled:opacity-60 resize-y'

interface CommentsSectionProps {
  needId: string
  comments: NeedComment[]
  canComment: boolean
  onChanged: () => void
  /** Si se provee, muestra el enlace "Reportar" junto a cada comentario. */
  reportUrlFor?: (comment: NeedComment) => string
}

/** Hilo de colaboración (MVP §14): comentarios claramente distintos de las ofertas. */
export function CommentsSection({
  needId,
  comments,
  canComment,
  onChanged,
  reportUrlFor,
}: CommentsSectionProps) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (trimmed.length < 2 || trimmed.length > 2000) {
      setError('Escribe un mensaje de entre 2 y 2000 caracteres.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await addComment(needId, trimmed)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBody('')
    onChanged()
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <p className="text-closed-500 text-sm">Todavía no hay mensajes en este hilo.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="border-arena-200 flex gap-2 rounded-lg border bg-white px-3 py-2"
            >
              <MessageCircle
                className="text-closed-400 mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-closed-800 text-sm">
                  <span className="font-medium">{comment.display_name}</span>
                  <span className="text-closed-400"> · {timeAgo(comment.created_at)}</span>
                </p>
                <p className="text-closed-700 mt-0.5 text-sm whitespace-pre-line">{comment.body}</p>
                {reportUrlFor ? (
                  <Link
                    to={reportUrlFor(comment)}
                    className="text-closed-400 hover:text-danger-600 mt-1 inline-block text-xs underline"
                  >
                    Reportar
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2">
          <textarea
            name="comment"
            rows={3}
            maxLength={2000}
            placeholder="Escribe un mensaje para coordinar la ayuda…"
            className={textareaClass}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          {error ? <Alert>{error}</Alert> : null}
          <div>
            <Button type="submit" loading={submitting}>
              {submitting ? 'Publicando…' : 'Publicar mensaje'}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
