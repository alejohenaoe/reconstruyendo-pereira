import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  CheckCircle,
  HandHeart,
  HardHat,
  HeartHandshake,
  HelpCircle,
  MapPin,
  MessageSquare,
  PenLine,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { NeedCard } from '@/features/needs/components/NeedCard'
import { usePublicNeeds } from '@/features/needs/hooks/usePublicNeeds'
import type { NeedFilters as NeedFiltersValue } from '@/features/needs/types'
import { AppHeader } from '@/shared/components/AppHeader'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/EmptyState'
import { Skeleton } from '@/shared/components/Skeleton'
import { buttonStyles } from '@/shared/components/buttonStyles'

const EMPTY_FILTERS: NeedFiltersValue = { municipalityId: null, categoryId: null, status: null }

const askHelpSteps = [
  {
    icon: PenLine,
    title: 'Publica tu pedido',
    text: 'Cuenta qué necesitas reparar en tu casa —paredes, techos, puertas— con fotos y una ubicación aproximada.',
  },
  {
    icon: HandHeart,
    title: 'Recibe ofertas',
    text: 'Las personas de tu comunidad se ofrecen a aportar trabajo, materiales o conocimientos.',
  },
  {
    icon: CheckCircle,
    title: 'Confirma cuando esté resuelto',
    text: 'Te pones en contacto, coordinan la ayuda y confirmas cuando el pedido queda solucionado.',
  },
]

const helpSteps = [
  {
    icon: MapPin,
    title: 'Explora los pedidos',
    text: 'Mira los pedidos de ayuda de tu región y encuentra uno donde puedas aportar.',
  },
  {
    icon: MessageSquare,
    title: 'Ofrécete a ayudar',
    text: 'Cuenta qué puedes aportar: albañilería, carpintería, materiales, herramientas, transporte o asesoría.',
  },
  {
    icon: Users,
    title: 'Coordina con la persona',
    text: 'Se ponen en contacto contigo para coordinar la ayuda y confirmar cuando esté lista.',
  },
]

const values = [
  { icon: HeartHandshake, text: 'Gratis y sin ánimo de lucro' },
  { icon: Users, text: 'Comunidad' },
  { icon: ShieldCheck, text: 'Transparencia' },
  { icon: HardHat, text: 'Reconstrucción' },
]

const tradeChips = ['Reconstrucción de viviendas', 'Paredes', 'Techos', 'Retiro de escombros']

/** Ilustración decorativa del hero: una casa en reconstrucción (sin imágenes externas). */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 340 260" aria-hidden="true" className="mx-auto w-full max-w-sm lg:max-w-md">
      {/* Cielo cálido */}
      <rect width="340" height="260" rx="24" fill="#f4eee1" />
      <circle cx="282" cy="52" r="26" fill="#e9ddc6" />
      <circle cx="250" cy="70" r="4" fill="#82c9b1" />
      <circle cx="272" cy="92" r="3" fill="#f0c2ab" />
      <circle cx="232" cy="96" r="3" fill="#82c9b1" />

      {/* Casco de obra */}
      <path d="M52 80 a15 15 0 0 1 30 0 Z" fill="#26745d" />
      <rect x="46" y="80" width="42" height="7" rx="3.5" fill="#26745d" />

      {/* Casa en reconstrucción */}
      <ellipse cx="170" cy="152" rx="76" ry="10" fill="#e9ddc6" />
      <path d="M128 82 L170 44 L212 82 Z" fill="#f0c2ab" />
      <rect
        x="134"
        y="82"
        width="72"
        height="66"
        rx="10"
        fill="#d7f0e6"
        stroke="#b0e0cf"
        strokeWidth="3"
      />
      {/* Apertura en la pared (zona a reparar) */}
      <rect
        x="144"
        y="96"
        width="26"
        height="46"
        rx="4"
        fill="#faf7f1"
        stroke="#e9ddc6"
        strokeWidth="3"
      />
      {/* Ladrillo entrando en la pared */}
      <rect
        x="178"
        y="108"
        width="20"
        height="11"
        rx="2"
        fill="#b85c38"
        transform="rotate(-8 188 113)"
      />
      {/* Corazón sobre el techo */}
      <path
        d="M170 40c-1.1-1.2-2.8-2.2-4.3-2.2-2.2 0-4 1.8-4 3.9 0 1.2.5 2.3 1.4 3.1l6.9 6.9 6.9-6.9c.9-.8 1.4-1.9 1.4-3.1 0-2.1-1.8-3.9-4-3.9-1.5 0-3.2 1-4.3 2.2Z"
        fill="#b85c38"
      />
    </svg>
  )
}

/** Página de inicio (UX §7): propuesta de valor, cómo funciona y pedidos de ayuda recientes. */
export function HomePage() {
  const { status } = useAuth()
  const unauthenticated = status === 'UNAUTHENTICATED'
  const filters = useMemo(() => EMPTY_FILTERS, [])
  const { needs, images, offerCounts, loading, error } = usePublicNeeds(filters)
  const recentNeeds = needs.slice(0, 4)

  const askForHelpHref = unauthenticated ? '/register?redirect=/needs/new' : '/needs/new'

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main>
        <section className="from-arena-50 to-arena-100 relative overflow-hidden bg-gradient-to-b">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2724%27 viewBox=%270 0 48 24%27%3E%3Cg fill=%27none%27 stroke=%27%23e9ddc6%27 stroke-width=%272%27%3E%3Crect x=%270.5%27 y=%270.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2724.5%27 y=%270.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2712.5%27 y=%2712.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2736.5%27 y=%2712.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
              <span className="bg-brand-100 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
                Terremoto del 10 de agosto de 2026
              </span>
              <h1 className="text-brand-900 mt-4 text-4xl font-semibold sm:text-5xl">
                Ayudemos <span className="text-brand-600">entre todos</span>
              </h1>
              <p className="text-closed-600 mt-4 text-lg leading-relaxed">
                Si el terremoto dañó tu casa, pide ayuda para repararla —paredes, techos,
                escombros—. Si puedes aportar mano de obra, materiales o conocimientos, ofrece tu
                ayuda a tu comunidad.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <Link
                  to={askForHelpHref}
                  className={buttonStyles({ variant: 'primary', size: 'lg', fullWidth: true })}
                >
                  Pedir ayuda
                </Link>
                <Link
                  to="/needs"
                  className={buttonStyles({ variant: 'brick', size: 'lg', fullWidth: true })}
                >
                  Ayudar
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium lg:justify-start">
                {tradeChips.map((chip) => (
                  <li
                    key={chip}
                    className="border-brick-200 text-brick-700 rounded-full border bg-white px-3 py-1"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden sm:block">
              <HeroIllustration />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-4 py-12">
          <h2 className="text-brand-900 text-center text-2xl font-semibold">Cómo funciona</h2>
          <p className="text-closed-600 mt-2 text-center text-sm">
            Del terremoto a la reconstrucción: pide ayuda para tu vivienda u ofrécete para los
            trabajos de tu comunidad.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                <span className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded-xl">
                  <HandHeart className="size-5" aria-hidden="true" />
                </span>
                ¿Necesitas ayuda?
              </h3>
              <ol className="mt-4 flex flex-col gap-4">
                {askHelpSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="bg-brand-100 text-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-closed-800 text-sm font-semibold">{step.title}</h4>
                      <p className="text-closed-500 mt-0.5 text-sm leading-relaxed">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                <span className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded-xl">
                  <Users className="size-5" aria-hidden="true" />
                </span>
                ¿Quieres ayudar?
              </h3>
              <ol className="mt-4 flex flex-col gap-4">
                {helpSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="bg-brand-100 text-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-closed-800 text-sm font-semibold">{step.title}</h4>
                      <p className="text-closed-500 mt-0.5 text-sm leading-relaxed">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </section>

        <section className="bg-arena-100 py-12">
          <div className="mx-auto w-full max-w-2xl px-4">
            <div className="mb-4 flex items-end justify-between gap-2">
              <div>
                <h2 className="text-brand-900 text-2xl font-semibold">
                  Pedidos de ayuda recientes
                </h2>
                <p className="text-closed-500 text-sm">
                  Vecinos pidiendo ayuda para reconstruir sus viviendas tras el terremoto.
                </p>
              </div>
              <Link
                to="/needs"
                className="text-brand-700 shrink-0 text-sm font-medium hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {loading ? (
              <div
                className="flex flex-col gap-3"
                role="status"
                aria-label="Cargando pedidos de ayuda"
              >
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </div>
            ) : error ? (
              <EmptyState
                icon={HelpCircle}
                title="No pudimos cargar los pedidos de ayuda"
                description={error}
              />
            ) : recentNeeds.length === 0 ? (
              <EmptyState
                icon={HandHeart}
                title="Todavía no hay pedidos de ayuda publicados"
                description="El primero puede ser el tuyo: pide ayuda para reparar tu vivienda."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentNeeds.map((need) => (
                  <li key={need.id}>
                    <NeedCard
                      need={need}
                      offerCount={offerCounts[need.id] ?? 0}
                      image={images[need.id] ?? null}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-12">
          <ul className="text-closed-500 flex flex-col items-center gap-4 text-sm sm:flex-row sm:justify-center sm:gap-10">
            {values.map((value) => (
              <li key={value.text} className="flex items-center gap-2">
                <value.icon className="text-brand-600 size-5" aria-hidden="true" />
                {value.text}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
