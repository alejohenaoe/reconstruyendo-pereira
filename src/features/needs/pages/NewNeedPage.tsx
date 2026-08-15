import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { useMunicipalities } from '@/features/auth/hooks/useMunicipalities'
import { NeedForm } from '@/features/needs/components/NeedForm'
import type { NeedFormValues } from '@/features/needs/components/NeedForm'
import type { ImageUploadState, PickedImage } from '@/features/needs/components/ImagePicker'
import { useNeedCategories } from '@/features/needs/hooks/useNeedCategories'
import {
  attachAddress,
  createNeed,
  uploadNeedImage,
} from '@/features/needs/services/needPublishService'
import type { Need } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { AppHeader } from '@/shared/components/AppHeader'
import { PageLoader } from '@/shared/components/PageLoader'

/** Página de publicación (Fase 4): crear necesidad → fotos → dirección. */
export function NewNeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    municipalities,
    loading: loadingMunicipalities,
    error: municipalitiesError,
  } = useMunicipalities()
  const { categories, loading: loadingCategories, error: categoriesError } = useNeedCategories()

  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<Record<string, ImageUploadState>>({})

  const createdNeedRef = useRef<Need | null>(null)
  const addressDoneRef = useRef(false)

  async function handleSubmit(values: NeedFormValues, images: PickedImage[]) {
    if (!user) return
    setSubmitting(true)
    setGlobalError(null)
    try {
      let need = createdNeedRef.current
      if (!need) {
        const result = await createNeed(
          {
            title: values.title,
            description: values.description,
            categoryId: values.categoryId,
            municipalityId: values.municipalityId,
            neighborhood: values.neighborhood,
            needsAssessment: values.needsAssessment,
          },
          user.id,
        )
        if (!result.ok) {
          setGlobalError(result.error)
          return
        }
        need = result.data
        createdNeedRef.current = need
      }

      let partialFailure = false

      if (values.address && !addressDoneRef.current) {
        const addressResult = await attachAddress(need.id, values.address)
        if (addressResult.ok) {
          addressDoneRef.current = true
        } else {
          setGlobalError(addressResult.error)
          partialFailure = true
        }
      }

      if (images.length > 0) {
        const results = await Promise.all(
          images.map(async (image, index) => {
            setUploadState((prev) => ({ ...prev, [image.id]: 'uploading' }))
            const result = await uploadNeedImage(need.id, image.file, index === 0)
            setUploadState((prev) => ({ ...prev, [image.id]: result.ok ? 'done' : 'error' }))
            if (!result.ok) partialFailure = true
            return result
          }),
        )
        if (results.some((result) => !result.ok)) {
          setGlobalError('Algunas fotos no se subieron. Tu pedido de ayuda ya está publicado.')
        }
      }

      navigate(`/needs/${need.id}`, {
        replace: true,
        state: partialFailure
          ? {
              notice:
                'Tu pedido de ayuda se publicó, pero algunas fotos o la dirección no se guardaron. Puedes volver a intentarlo.',
            }
          : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingMunicipalities || loadingCategories) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="bg-closed-100/40 min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="text-brand-900 text-2xl font-semibold">Publicar un pedido de ayuda</h1>
        <p className="text-closed-500 mt-1 text-sm">
          Cuenta qué necesitas para que alguien de la comunidad pueda ayudarte.
        </p>

        {municipalitiesError || categoriesError ? (
          <div className="mt-4">
            <Alert>{municipalitiesError ?? categoriesError}</Alert>
          </div>
        ) : (
          <div className="border-closed-100 mt-6 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
            <NeedForm
              municipalities={municipalities}
              categories={categories}
              uploadState={uploadState}
              submitting={submitting}
              globalError={globalError}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </main>
    </div>
  )
}
