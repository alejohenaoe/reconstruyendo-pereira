import { Link, useLocation, useParams } from 'react-router-dom'

import { ArrowLeft, CheckCircle } from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { CommentsSection } from '@/features/help/components/CommentsSection'
import { HelpOfferForm } from '@/features/help/components/HelpOfferForm'
import { NeedStatusActions } from '@/features/help/components/NeedStatusActions'
import { OfferersSection } from '@/features/help/components/OfferersSection'
import { useCapabilities } from '@/features/help/hooks/useCapabilities'
import { useNeedCommunity } from '@/features/help/hooks/useNeedCommunity'
import type { NeedComment, Offerer } from '@/features/help/types'
import { NeedGallery } from '@/features/needs/components/NeedGallery'
import { NeedHeader } from '@/features/needs/components/NeedHeader'
import { StructuralWarning } from '@/features/needs/components/StructuralWarning'
import { usePublicNeed } from '@/features/needs/hooks/usePublicNeed'
import { hasStructuralRisk } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { AppHeader } from '@/shared/components/AppHeader'
import { Card } from '@/shared/components/Card'
import { PageLoader } from '@/shared/components/PageLoader'
import { buttonStyles } from '@/shared/components/buttonStyles'

/** Detalle público de una necesidad con hilo de colaboración (UX §10, §16, §18, §37, §40). */
export function NeedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice ?? null
  const { status, user } = useAuth()
  const {
    need,
    images,
    authorName,
    loading,
    error,
    code,
    reload: reloadNeed,
  } = usePublicNeed(id ?? '')
  const {
    offerers,
    comments,
    error: communityError,
    reload: reloadCommunity,
  } = useNeedCommunity(id ?? '')
  const { capabilities } = useCapabilities()

  if (loading || !id) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <PageLoader />
      </div>
    )
  }

  if (error || !need) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-closed-700 text-xl font-semibold">
            {code === 'not_found' ? 'No encontramos este pedido de ayuda.' : error}
          </h1>
          <Link to="/needs" className={buttonStyles({ variant: 'secondary' })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a pedidos de ayuda
          </Link>
        </main>
      </div>
    )
  }

  const isOwner = user?.id === need.user_id
  const isAuthenticated = status === 'AUTHENTICATED'
  const needActive = need.status === 'OPEN' || need.status === 'IN_PROGRESS'
  const myOffer = offerers.find((offer) => offer.user_id === user?.id) ?? null
  const canOffer = isAuthenticated && !isOwner && needActive && !myOffer

  const beforeImages = images.filter((image) => image.kind !== 'AFTER')
  const afterImages = images.filter((image) => image.kind === 'AFTER')

  const structuralRisk = hasStructuralRisk({
    title: need.title,
    description: need.description,
    categoryLabel: need.need_categories?.label_es ?? null,
    needsAssessment: need.needs_assessment,
  })

  const reportNeedUrl = `/report?type=need&id=${need.id}&label=${encodeURIComponent(`El pedido de ayuda "${need.title}"`)}&needId=${need.id}`
  const reportAuthorUrl = `/report?type=user&id=${need.user_id}&label=${encodeURIComponent(`El usuario ${authorName ?? 'del autor'}`)}&needId=${need.id}`
  const reportCommentUrl = (comment: NeedComment) =>
    `/report?type=comment&id=${comment.id}&label=${encodeURIComponent(`El comentario de ${comment.display_name}`)}&needId=${need.id}`
  const reportOffererUrl = (offerer: Offerer) =>
    `/report?type=user&id=${offerer.user_id}&label=${encodeURIComponent(`El usuario ${offerer.display_name}`)}&needId=${need.id}`

  return (
    <div className="bg-arena-50 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <Link
          to="/needs"
          className="text-closed-500 hover:text-brand-700 mb-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a pedidos de ayuda
        </Link>

        <NeedHeader need={need} authorName={authorName} />

        {notice ? (
          <div className="mt-4">
            <Alert variant="info">{notice}</Alert>
          </div>
        ) : null}

        {structuralRisk ? (
          <div className="mt-4">
            <StructuralWarning context="detail" />
          </div>
        ) : null}

        {isAuthenticated ? (
          <div className="text-closed-400 mt-3 flex items-center gap-3 text-xs">
            <span>¿Ves algo inapropiado?</span>
            <Link to={reportNeedUrl} className="hover:text-danger-600 underline">
              Reportar este pedido de ayuda
            </Link>
            {!isOwner ? (
              <Link to={reportAuthorUrl} className="hover:text-danger-600 underline">
                Reportar al autor
              </Link>
            ) : null}
          </div>
        ) : null}

        <section className="mt-6 flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
              Descripción
            </h2>
            <p className="text-closed-700 text-sm leading-relaxed whitespace-pre-line">
              {need.description}
            </p>
          </Card>

          <Card className="flex flex-col gap-4">
            <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
              {afterImages.length > 0 ? 'Fotografías (antes)' : 'Fotografías'}
            </h2>
            <NeedGallery images={beforeImages} />
          </Card>

          {/* Cierre del pedido: cómo quedó y agradecimiento público (MVP §23). */}
          {need.resolution_note || afterImages.length > 0 ? (
            <Card className="border-success-100 flex flex-col gap-4">
              <h2 className="text-success-700 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                <CheckCircle className="size-4" aria-hidden="true" />
                Cómo quedó
              </h2>
              {need.resolution_note ? (
                <p className="text-closed-700 text-sm leading-relaxed whitespace-pre-line">
                  {need.resolution_note}
                </p>
              ) : null}
              {afterImages.length > 0 ? <NeedGallery images={afterImages} /> : null}
            </Card>
          ) : null}

          {isOwner ? (
            <Card className="flex flex-col gap-4">
              <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
                Estado del pedido de ayuda
              </h2>
              <NeedStatusActions
                needId={need.id}
                status={need.status}
                resolutionNote={need.resolution_note}
                onChanged={() => void reloadNeed()}
              />
            </Card>
          ) : null}

          <Card className="flex flex-col gap-4">
            <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
              Personas que se ofrecieron{offerers.length > 0 ? ` (${offerers.length})` : ''}
            </h2>
            <OfferersSection
              needId={need.id}
              offerers={offerers}
              currentUserId={user?.id ?? null}
              isOwner={isOwner}
              onChanged={() => void reloadCommunity()}
              reportUrlFor={isAuthenticated ? reportOffererUrl : undefined}
            />
          </Card>

          {communityError ? <Alert variant="info">{communityError}</Alert> : null}

          <div>
            {!isAuthenticated ? (
              <div className="border-brand-200 bg-brand-50 rounded-lg border p-4 text-sm">
                <p className="text-brand-800 font-medium">¿Puedes ayudar?</p>
                <p className="text-brand-700 mt-1">
                  Crea una cuenta o inicia sesión para ofrecer tu ayuda.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/register?redirect=${encodeURIComponent(`/needs/${need.id}`)}`}
                    className={buttonStyles({ variant: 'primary' })}
                  >
                    Crear cuenta
                  </Link>
                  <Link
                    to={`/login?redirect=${encodeURIComponent(`/needs/${need.id}`)}`}
                    className={buttonStyles({ variant: 'secondary' })}
                  >
                    Entrar
                  </Link>
                </div>
              </div>
            ) : canOffer ? (
              capabilities.length > 0 ? (
                <HelpOfferForm
                  needId={need.id}
                  capabilities={capabilities}
                  onOffered={() => void reloadCommunity()}
                />
              ) : null
            ) : isAuthenticated && !isOwner && !needActive ? (
              <Alert variant="info">Este pedido de ayuda ya no acepta nuevas ofertas.</Alert>
            ) : null}
          </div>

          <Card className="flex flex-col gap-4">
            <h2 className="text-brand-800 text-sm font-semibold tracking-wide uppercase">
              Hilo de colaboración
            </h2>
            <CommentsSection
              needId={need.id}
              comments={comments}
              canComment={isAuthenticated}
              onChanged={() => void reloadCommunity()}
              reportUrlFor={isAuthenticated ? reportCommentUrl : undefined}
            />
          </Card>
        </section>
      </main>
    </div>
  )
}
