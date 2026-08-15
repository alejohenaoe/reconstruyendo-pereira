import { useEffect, useState } from 'react'

import { Eraser, ListFilter, X } from 'lucide-react'

import type { Municipality } from '@/features/auth/types'
import type {
  NeedCategory,
  NeedFilters as NeedFiltersValue,
  NeedStatus,
} from '@/features/needs/types'
import { NEED_STATUS_LABELS, NEED_STATUS_ORDER } from '@/features/needs/types'
import { Button } from '@/shared/components/Button'

interface NeedFiltersProps {
  filters: NeedFiltersValue
  onChange: (next: NeedFiltersValue) => void
  municipalities: Municipality[]
  categories: NeedCategory[]
}

const selectClass =
  'w-full rounded-md border border-closed-100 bg-white px-3 py-2 text-sm text-closed-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

/** Filtros del listado público (UX §39): inline en desktop, panel/modal en móvil. */
export function NeedFilters({ filters, onChange, municipalities, categories }: NeedFiltersProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const activeCount = [filters.municipalityId, filters.categoryId, filters.status].filter(
    (value) => value !== null,
  ).length
  const clearable = activeCount > 0

  function setMunicipality(value: string) {
    onChange({ ...filters, municipalityId: value ? Number(value) : null })
  }
  function setCategory(value: string) {
    onChange({ ...filters, categoryId: value ? Number(value) : null })
  }
  function setStatus(value: string) {
    onChange({ ...filters, status: value ? (value as NeedStatus) : null })
  }
  function clear() {
    onChange({ municipalityId: null, categoryId: null, status: null })
  }

  const selects = (
    <>
      <label className="flex flex-col gap-1">
        <span className="text-closed-600 text-xs font-medium">Municipio</span>
        <select
          className={selectClass}
          value={filters.municipalityId ?? ''}
          onChange={(event) => setMunicipality(event.target.value)}
        >
          <option value="">Todos los municipios</option>
          {municipalities.map((municipality) => (
            <option key={municipality.id} value={municipality.id}>
              {municipality.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-closed-600 text-xs font-medium">Categoría</span>
        <select
          className={selectClass}
          value={filters.categoryId ?? ''}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label_es}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-closed-600 text-xs font-medium">Estado</span>
        <select
          className={selectClass}
          value={filters.status ?? ''}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos los estados</option>
          {NEED_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {NEED_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
    </>
  )

  return (
    <div>
      {/* Desktop: filtros inline */}
      <div className="hidden items-end gap-3 sm:flex">
        {selects}
        {clearable ? (
          <button
            type="button"
            onClick={clear}
            className="text-closed-500 hover:text-closed-800 mb-2 flex shrink-0 items-center gap-1 text-sm font-medium"
          >
            <Eraser className="size-4" aria-hidden="true" />
            Limpiar
          </button>
        ) : null}
      </div>

      {/* Móvil: botón que abre el panel */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-closed-100 text-closed-700 hover:border-brand-300 flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <ListFilter className="size-4" aria-hidden="true" />
            Filtros
          </span>
          {clearable ? (
            <span className="bg-brand-600 rounded-full px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          ) : null}
        </button>

        {open ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full rounded-t-2xl bg-white p-4"
              onClick={(event) => {
                event.stopPropagation()
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-brand-900 text-base font-semibold">Filtros</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-closed-500 hover:text-closed-700"
                  aria-label="Cerrar filtros"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-col gap-3">{selects}</div>
              <div className="mt-4 flex flex-col gap-2">
                <Button fullWidth onClick={() => setOpen(false)}>
                  Ver resultados
                </Button>
                {clearable ? (
                  <button
                    type="button"
                    onClick={() => {
                      clear()
                      setOpen(false)
                    }}
                    className="text-closed-500 hover:text-closed-800 text-sm font-medium"
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
