import type { AdminStats } from '@/features/moderation/types'
import { NEED_STATUS_LABELS } from '@/features/needs/types'

interface AdminStatsCardsProps {
  stats: AdminStats | null
}

/** Tarjetas de resumen del panel admin. */
export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  if (!stats) return null

  const cards = [
    { label: 'Usuarios', value: String(stats.users), detail: `${stats.users_banned} suspendidos` },
    {
      label: 'Pedidos de ayuda',
      value: String(stats.needs),
      detail: `${stats.needs_hidden} ocultos`,
    },
    { label: 'Ofertas', value: String(stats.offers), detail: 'de ayuda' },
    { label: 'Comentarios', value: String(stats.comments), detail: 'en el hilo' },
    { label: 'Reportes pendientes', value: String(stats.reports_pending), detail: 'por revisar' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="border-closed-100 rounded-md border bg-white p-3">
            <p className="text-closed-500 text-xs font-medium uppercase">{card.label}</p>
            <p className="text-brand-800 mt-1 text-2xl font-semibold">{card.value}</p>
            <p className="text-closed-500 text-xs">{card.detail}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-closed-500 mb-2 text-xs font-medium uppercase">
          Pedidos de ayuda por estado
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.needs_by_status).map(([status, count]) => (
            <span
              key={status}
              className="border-closed-100 text-closed-700 rounded-full border bg-white px-3 py-1 text-sm"
            >
              {NEED_STATUS_LABELS[status as keyof typeof NEED_STATUS_LABELS] ?? status}: {count}
            </span>
          ))}
          {Object.keys(stats.needs_by_status).length === 0 ? (
            <span className="text-closed-400 text-sm">Sin datos</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
