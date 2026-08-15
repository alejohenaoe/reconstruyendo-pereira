import type { Capability } from '@/features/help/types'

interface CapabilityPickerProps {
  capabilities: Capability[]
  selectedIds: number[]
  onToggle: (id: number) => void
  legend: string
  description?: string
  disabled?: boolean
  error?: string
}

/**
 * Tipo de participación como capacidades multi-selección (MVP §19): una persona
 * puede necesitar ayuda y a la vez aportar materiales, así que nunca son roles
 * excluyentes.
 */
export function CapabilityPicker({
  capabilities,
  selectedIds,
  onToggle,
  legend,
  description,
  disabled = false,
  error,
}: CapabilityPickerProps) {
  return (
    <fieldset className="flex flex-col gap-1.5" disabled={disabled}>
      <legend className="text-closed-700 text-sm font-medium">{legend}</legend>
      {description ? <p className="text-closed-500 text-xs">{description}</p> : null}
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {capabilities.map((capability) => {
          const checked = selectedIds.includes(capability.id)
          return (
            <label
              key={capability.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-arena-200 text-closed-700 hover:border-brand-300'
              }`}
            >
              <input
                type="checkbox"
                name="capabilities"
                value={capability.slug}
                checked={checked}
                onChange={() => onToggle(capability.id)}
                className="text-brand-600 border-arena-300 focus:ring-brand-500 size-4 shrink-0 rounded"
              />
              {capability.label_es}
            </label>
          )
        })}
      </div>
      {error ? <p className="text-danger-600 text-xs">{error}</p> : null}
    </fieldset>
  )
}
