import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  CheckCircle,
  HandHeart,
  HardHat,
  HeartHandshake,
  HelpCircle,
  LifeBuoy,
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

const BRICK_PATTERN_URL =
  'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2748%27 height=%2724%27 viewBox=%270 0 48 24%27%3E%3Cg fill=%27none%27 stroke=%27%23e9ddc6%27 stroke-width=%272%27%3E%3Crect x=%270.5%27 y=%270.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2724.5%27 y=%270.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2712.5%27 y=%2712.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3Crect x=%2736.5%27 y=%2712.5%27 width=%2723%27 height=%2711%27 rx=%272%27/%3E%3C/g%3E%3C/svg%3E")'

/** Mockup del producto en CSS puro (sin imágenes): la historia de un pedido de ayuda en bucle. */
function HeroProductMockup() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto w-full max-w-xs lg:max-w-sm"
    >
      {/* Tarjeta principal: un pedido de ayuda */}
      <div className="border-arena-200 rounded-xl border bg-white p-2.5 shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
          <img
            src="/images/hero-pedido.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          <p className="text-brand-900 text-[13px] font-semibold">Reparar techo de la casa</p>
          <p className="text-closed-500 flex items-center gap-1 text-[11px]">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            Dosquebradas · La Pradera
          </p>

          {/* Hilo: las escenas de la historia (ciclo de 14 s) */}
          <div className="mt-1.5 flex flex-col gap-1">
            <div className="animate-story-a border-arena-200 bg-arena-50 flex items-center gap-2 rounded-lg border px-1.5 py-1 motion-reduce:animate-none">
              <span className="bg-brand-600 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                Ju
              </span>
              <p className="text-closed-700 min-w-0 text-[10px] leading-tight">
                <span className="font-semibold">Juan</span> se ofreció ·{' '}
                <span className="text-brick-700 font-medium">Albañilería</span>
              </p>
            </div>
            <div className="animate-story-b border-arena-200 bg-arena-50 flex items-center gap-2 rounded-lg border px-1.5 py-1 motion-reduce:animate-none">
              <span className="bg-brick-600 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                Jo
              </span>
              <p className="text-closed-700 min-w-0 text-[10px] leading-tight">
                <span className="font-semibold">Jorge</span> aporta ·{' '}
                <span className="text-brick-700 font-medium">2 bultos de cemento</span>
              </p>
            </div>
            <div className="animate-story-c bg-success-50 border-success-100 text-success-700 flex items-center gap-1.5 rounded-lg border px-1.5 py-1 text-[10px] font-semibold motion-reduce:animate-none">
              <CheckCircle className="size-3 shrink-0" aria-hidden="true" />
              Ayuda en camino
            </div>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="bg-need-100 text-need-700 animate-pulse-soft inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium motion-reduce:animate-none">
              <LifeBuoy className="size-3" aria-hidden="true" />
              Necesita ayuda
            </span>
            <span className="text-brand-700 flex items-center gap-1 text-[11px] font-medium">
              <HandHeart className="size-3" aria-hidden="true" />3 personas se ofrecieron
            </span>
          </div>

          {/* Barra de progreso del ciclo */}
          <div className="bg-arena-200 mt-2.5 h-1 w-full overflow-hidden rounded-full">
            <div className="animate-progress bg-brand-600 h-full w-full rounded-full motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </div>
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
            style={{ backgroundImage: BRICK_PATTERN_URL }}
          />
          <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
              <span className="bg-brand-100 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
                Terremoto del 10 de agosto de 2026
              </span>
              <h1 className="text-brand-900 mt-4 text-4xl font-semibold sm:text-5xl">
                Ayudemos <span className="text-brand-600">entre todos.</span>
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
              <HeroProductMockup />
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
