import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  CheckCircle,
  HandHeart,
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
import { Skeleton } from '@/shared/components/Skeleton'
import { buttonStyles } from '@/shared/components/buttonStyles'

const EMPTY_FILTERS: NeedFiltersValue = { municipalityId: null, categoryId: null, status: null }

const askHelpSteps = [
  {
    icon: PenLine,
    title: 'Publica tu pedido',
    text: 'Cuenta qué necesitas, con fotos y una ubicación aproximada. No hace falta saber los detalles técnicos.',
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
    text: 'Cuenta qué puedes aportar: mano de obra, materiales, herramientas, transporte o asesoría.',
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
]

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
        <section className="bg-brand-50">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:py-24">
            <span className="bg-brand-100 text-brand-700 rounded-full px-3 py-1 text-xs font-semibold">
              Comunidad del eje cafetero
            </span>
            <h1 className="text-brand-900 mt-4 text-4xl font-semibold sm:text-5xl">
              Ayudemos entre todos
            </h1>
            <p className="text-closed-600 mt-4 max-w-xl text-lg leading-relaxed">
              Conecta personas que necesitan ayuda con quienes pueden aportar trabajo, conocimientos
              o materiales.
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <Link
                to={askForHelpHref}
                className={buttonStyles({ variant: 'primary', size: 'lg', fullWidth: true })}
              >
                Pedir ayuda
              </Link>
              <Link
                to="/needs"
                className={buttonStyles({ variant: 'secondary', size: 'lg', fullWidth: true })}
              >
                Ayudar
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-4 py-12">
          <h2 className="text-brand-900 text-center text-2xl font-semibold">Cómo funciona</h2>
          <p className="text-closed-600 mt-2 text-center text-sm">
            Así es el ciclo, lo pidas o lo ofrezcas.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border-closed-100 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                <HandHeart className="text-brand-600 size-5" aria-hidden="true" />
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
            </div>

            <div className="border-closed-100 rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-brand-900 flex items-center gap-2 text-lg font-semibold">
                <Users className="text-brand-600 size-5" aria-hidden="true" />
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
            </div>
          </div>
        </section>

        <section className="bg-closed-100/40 py-12">
          <div className="mx-auto w-full max-w-2xl px-4">
            <div className="mb-4 flex items-end justify-between gap-2">
              <div>
                <h2 className="text-brand-900 text-2xl font-semibold">
                  Pedidos de ayuda recientes
                </h2>
                <p className="text-closed-500 text-sm">Personas de tu región pidiendo ayuda.</p>
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
              <div className="text-closed-600 flex flex-col items-center gap-2 py-10 text-center">
                <HelpCircle className="text-closed-300 size-10" aria-hidden="true" />
                <p>{error}</p>
              </div>
            ) : recentNeeds.length === 0 ? (
              <div className="text-closed-600 flex flex-col items-center gap-2 py-10 text-center">
                <HandHeart className="text-closed-300 size-10" aria-hidden="true" />
                <p>Todavía no hay pedidos de ayuda publicados.</p>
              </div>
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
