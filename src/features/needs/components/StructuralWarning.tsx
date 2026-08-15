import { TriangleAlert } from 'lucide-react'

import { Alert } from '@/shared/components/Alert'

interface StructuralWarningProps {
  /** `publish` habla en segunda persona a quien escribe; `detail`, a quien lee. */
  context: 'publish' | 'detail'
}

/**
 * Advertencia de posible daño estructural (MVP §22).
 *
 * Recomienda una evaluación profesional y deja explícito que la plataforma no
 * evalúa ni certifica la seguridad de una vivienda: ni afirma que sea segura,
 * ni presenta como certificación oficial lo que aquí opine un profesional.
 * El tono es informativo, no alarmista (UX §3.5).
 */
export function StructuralWarning({ context }: StructuralWarningProps) {
  return (
    <Alert variant="warning">
      <p className="flex items-center gap-1.5 font-medium">
        <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
        Puede haber daño estructural
      </p>
      <p className="mt-1 text-xs leading-relaxed">
        {context === 'publish'
          ? 'Lo que describes menciona partes que sostienen la casa (columnas, vigas, cimientos, grietas). Antes de repararlas, busca que un ingeniero o arquitecto revise la vivienda.'
          : 'Este pedido menciona partes que sostienen la casa (columnas, vigas, cimientos, grietas). Conviene que un ingeniero o arquitecto revise la vivienda antes de repararla.'}
      </p>
      <p className="mt-1 text-xs leading-relaxed">
        Esta plataforma no evalúa ni certifica si una vivienda es segura. Lo que opinen aquí
        profesionales que se ofrezcan a ayudar no es una certificación oficial.
      </p>
    </Alert>
  )
}
