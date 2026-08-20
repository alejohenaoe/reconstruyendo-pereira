import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Spinner } from '@/shared/components/Spinner'
import { buttonStyles } from '@/shared/components/buttonStyles'
import type { ButtonSize, ButtonVariant } from '@/shared/components/buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Muestra un spinner y deshabilita el botón mientras la operación está en curso (UX §23). */
  loading?: boolean
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, fullWidth })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

export function ButtonLink({ to, variant, size, fullWidth, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonStyles({ variant, size, fullWidth })}>
      {children}
    </Link>
  )
}
