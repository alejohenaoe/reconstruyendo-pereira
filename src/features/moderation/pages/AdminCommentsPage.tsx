import { useState } from 'react'

import { CommentsTable } from '@/features/moderation/components/CommentsTable'
import { useAdminComments } from '@/features/moderation/hooks/useAdminComments'
import { PageLoader } from '@/shared/components/PageLoader'
import { buttonStyles } from '@/shared/components/buttonStyles'

export function AdminCommentsPage() {
  const [onlyHidden, setOnlyHidden] = useState(false)
  const { comments, loading, error, reload } = useAdminComments(onlyHidden)

  return (
    <>
      <div>
        <h1 className="text-brand-900 text-xl font-semibold">Comentarios</h1>
        <p className="text-closed-500 mt-1 text-sm">
          Oculta comentarios del hilo cuando la moderación lo indique. Un comentario oculto deja de
          verse para la comunidad, pero se conserva.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnlyHidden(false)}
          className={buttonStyles({ variant: onlyHidden ? 'subtle' : 'secondary', size: 'sm' })}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setOnlyHidden(true)}
          className={buttonStyles({ variant: onlyHidden ? 'secondary' : 'subtle', size: 'sm' })}
        >
          Solo ocultados
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <p className="text-danger-600 text-sm">{error}</p>
      ) : (
        <CommentsTable comments={comments} onChanged={() => void reload()} />
      )}
    </>
  )
}
