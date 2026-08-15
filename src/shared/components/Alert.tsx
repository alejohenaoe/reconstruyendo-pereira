import type { ReactNode } from 'react'

interface AlertProps {
  variant?: 'error' | 'info' | 'success'
  children: ReactNode
}

export function Alert({ variant = 'error', children }: AlertProps) {
  const styles = {
    error: 'border-danger-100 bg-danger-50 text-danger-700',
    info: 'border-info-100 bg-info-50 text-info-700',
    success: 'border-success-100 bg-success-50 text-success-700',
  }[variant]

  return (
    <div
      role={variant === 'error' ? 'alert' : undefined}
      className={`rounded-lg border px-4 py-3 text-sm ${styles}`}
    >
      {children}
    </div>
  )
}
