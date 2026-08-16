import { EyeOff, MapPin } from 'lucide-react'

import { NeedStatus } from '@/features/needs/components/NeedStatus'
import type { Need } from '@/features/needs/types'
import { Alert } from '@/shared/components/Alert'
import { Badge } from '@/shared/components/Badge'
import { Card } from '@/shared/components/Card'
import { timeAgo } from '@/shared/utils/timeAgo'

interface NeedHeaderProps {
  need: Need
  authorName: string | null
}

/** Encabezado del detalle (UX §37: estado, título, dónde, cuándo). */
export function NeedHeader({ need, authorName }: NeedHeaderProps) {
  const location = [need.municipalities?.name, need.neighborhood].filter(Boolean).join(' · ')

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="brand">{need.need_categories?.label_es}</Badge>
        <NeedStatus status={need.status} />
      </div>
      <h1 className="text-brand-900 mt-1 text-2xl font-semibold">{need.title}</h1>
      <p className="text-closed-600 flex items-center gap-1 text-sm">
        <MapPin className="size-4 shrink-0" aria-hidden="true" />
        {location || 'Ubicación no especificada'}
      </p>
      <p className="text-closed-500 text-xs">
        Publicado por {authorName ?? 'un vecino'} · {timeAgo(need.created_at)}
      </p>
      {need.is_hidden ? (
        <Alert variant="warning">
          <p className="flex items-center gap-1.5 font-medium">
            <EyeOff className="size-4 shrink-0" aria-hidden="true" />
            Oculto por moderación
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            Este pedido de ayuda no aparece en el listado público ni puede recibir ofertas nuevas.
            Solo lo ves tú y el equipo de moderación.
          </p>
        </Alert>
      ) : null}

      {need.needs_assessment ? (
        <Alert variant="info">
          La persona no está segura de qué necesita exactamente. Una evaluación profesional puede
          ayudar a definir el alcance.
        </Alert>
      ) : null}
    </Card>
  )
}
