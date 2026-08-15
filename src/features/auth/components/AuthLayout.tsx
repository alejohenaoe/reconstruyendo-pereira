import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Marco de las páginas de autenticación: tarjeta centrada con la marca (UX §3.3, §27). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="bg-brand-50 flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-brand-800 mb-6 block text-center text-2xl font-semibold">
          Ayudémonos
        </Link>
        <div className="bg-white rounded-xl p-6 shadow-md sm:p-8">
          <h1 className="text-closed-800 text-xl font-semibold">{title}</h1>
          {subtitle ? <p className="text-closed-500 mt-1 text-sm">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  )
}
