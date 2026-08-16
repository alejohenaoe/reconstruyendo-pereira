import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  CheckCircle,
  HandHeart,
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

const tradeChips = ['Reconstrucción de viviendas', 'Paredes', 'Techos', 'Retiro de escombros']

/**
 * Las dos puertas de entrada del hero (UX §7): en vez de vender la plataforma,
 * el inicio explica qué puede hacer aquí cada persona y la lleva a hacerlo.
 */
const doors = [
  {
    icon: HandHeart,
    title: 'Necesito ayuda',
    text: 'Cuéntales a tus vecinos qué quedó dañado en tu casa y sube unas fotos. Quien pueda darte una mano te responde ahí mismo.',
    action: 'Pedir ayuda',
    variant: 'primary',
    /** El destino real se resuelve en el render: pedir ayuda exige sesión. */
    target: 'ask',
  },
  {
    icon: Users,
    title: 'Quiero ayudar',
    text: 'Mira los pedidos de tu municipio y ofrece lo que tengas: trabajo, materiales, herramientas o conocimiento del oficio.',
    action: 'Ayudar',
    variant: 'brick',
    target: 'browse',
  },
] as const

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
        <section className="border-arena-200 bg-arena-50 border-b">
          <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
            <p className="text-closed-500 text-xs font-medium tracking-wide uppercase">
              Terremoto del 10 de agosto de 2026 · Eje cafetero
            </p>
            <h1 className="text-brand-900 mt-3 text-3xl font-semibold sm:text-4xl">
              Ayudemos entre todos
            </h1>
            <p className="text-closed-600 mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
              Si el terremoto dañó tu casa, aquí puedes pedir ayuda para repararla —paredes, techos,
              escombros—. Y si tienes manos, materiales o experiencia en obra, aquí está la gente de
              tu región que las necesita.
            </p>

            {/* Las dos puertas: qué puede hacer cada persona, y el camino para hacerlo. */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {doors.map((door) => (
                <div
                  key={door.title}
                  className="border-arena-200 flex flex-col rounded-xl border bg-white p-5"
                >
                  <h2 className="text-brand-900 flex items-center gap-2.5 text-lg font-semibold">
                    <span className="bg-brand-100 text-brand-700 flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <door.icon className="size-5" aria-hidden="true" />
                    </span>
                    {door.title}
                  </h2>
                  <p className="text-closed-600 mt-3 grow text-sm leading-relaxed">{door.text}</p>
                  <Link
                    to={door.target === 'ask' ? askForHelpHref : '/needs'}
                    className={`${buttonStyles({
                      variant: door.variant,
                      size: 'lg',
                      fullWidth: true,
                    })} mt-5`}
                  >
                    {door.action}
                  </Link>
                </div>
              ))}
            </div>

            <ul className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
              {tradeChips.map((chip) => (
                <li
                  key={chip}
                  className="border-brick-200 text-brick-700 rounded-full border bg-white px-3 py-1"
                >
                  {chip}
                </li>
              ))}
            </ul>

            {/* Imagen de contexto, decorativa: en móvil se omite para no empujar las acciones. */}
            <img
              src="/images/hero-pedido.jpg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="border-arena-200 mt-8 hidden h-44 w-full rounded-xl border object-cover sm:block"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-4 py-12">
          <h2 className="text-brand-900 text-center text-2xl font-semibold">
            Qué pasa cuando entras
          </h2>
          <p className="text-closed-600 mt-2 text-center text-sm">
            Todo ocurre dentro de la página y entre personas de la región. Estos son los pasos de
            cada lado.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                <span className="bg-brand-100 text-brand-700 flex size-10 items-center justify-center rounded-xl">
                  <HandHeart className="size-5" aria-hidden="true" />
                </span>
                Si pides ayuda
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
                Si vas a ayudar
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

        {/* Aquí no circula dinero: dejarlo explícito protege a la gente de que
            alguien use los pedidos de ayuda para pedir plata (UX §36). */}
        <section className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className="border-arena-200 flex gap-3 rounded-xl border bg-white p-5">
            <ShieldCheck className="text-brand-600 mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-closed-800 text-sm font-semibold">Aquí no se maneja dinero</h2>
              <p className="text-closed-500 mt-1 text-sm leading-relaxed">
                En Reconstruyendo no se pide ni se entrega dinero a nadie. Lo que se coordina es
                ayuda: trabajo, materiales, herramientas y conocimiento. Si alguien te pide plata o
                te ofrece pagarte, repórtalo desde el pedido o el comentario donde pasó.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
