import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { HandHeart, HardHat, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { addComment } from '@/features/help/services/helpService'
import type { CommentKind, NeedComment } from '@/features/help/types'
import { COMMENT_KIND_LABELS, COMMENT_KIND_OPTIONS } from '@/features/help/types'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { timeAgo } from '@/shared/utils/timeAgo'

/** Cada tipo de mensaje tiene icono y color propios (MVP §14, UX §3.6). */
const KIND_STYLES: Record<CommentKind, { Icon: LucideIcon; badge: string; icon: string }> = {
  COMMENT: { Icon: MessageCircle, badge: 'bg-closed-100 text-closed-600', icon: 'text-closed-400' },
  MATERIAL: { Icon: HandHeart, badge: 'bg-brick-100 text-brick-700', icon: 'text-brick-600' },
  RECOMMENDATION: { Icon: HardHat, badge: 'bg-brand-100 text-brand-700', icon: 'text-brand-700' },
}

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

function KindIcon({ kind, className }: { kind: CommentKind; className?: string }) {
  const { Icon, icon } = KIND_STYLES[kind]
  return <Icon className={`${icon} ${className ?? ''}`} aria-hidden="true" />
}

/** Hilo de colaboración (MVP §14): comentarios claramente distintos de las ofertas. */
export function CommentsSection({
  needId,
  comments,
  canComment,
  onChanged,
  reportUrlFor,
}: CommentsSectionProps) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<CommentKind>('COMMENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (trimmed.length < 2 || trimmed.length > 2000) {
      setError('Escribe un mensaje de entre 2 y 2000 caracteres.')
      return
    }
    if (!user) {
      setError('Inicia sesión para participar en el hilo.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await addComment(needId, user.id, trimmed, kind)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setBody('')
    setKind('COMMENT')
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
              <KindIcon kind={comment.kind} className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-closed-800 flex flex-wrap items-center gap-x-1.5 text-sm">
                  <span className="font-medium">{comment.display_name}</span>
                  {comment.kind !== 'COMMENT' ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_STYLES[comment.kind].badge}`}
                    >
                      {COMMENT_KIND_LABELS[comment.kind]}
                    </span>
                  ) : null}
                  <span className="text-closed-400">· {timeAgo(comment.created_at)}</span>
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
          <fieldset className="flex flex-col gap-1.5" disabled={submitting}>
            <legend className="text-closed-700 text-sm font-medium">¿Qué quieres compartir?</legend>
            <div className="flex flex-wrap gap-2">
              {COMMENT_KIND_OPTIONS.map((option) => (
                <label
                  key={option.kind}
                  title={option.hint}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    kind === option.kind
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-arena-200 text-closed-600 hover:border-brand-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="comment-kind"
                    value={option.kind}
                    checked={kind === option.kind}
                    onChange={() => setKind(option.kind)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="text-closed-500 text-xs">
              {COMMENT_KIND_OPTIONS.find((option) => option.kind === kind)?.hint}
            </p>
          </fieldset>
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
