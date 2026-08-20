export type ButtonVariant = 'primary' | 'secondary' | 'help' | 'danger' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

/** Clases compartidas entre <Button> y enlaces que parecen botones (UX §30). */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
}: ButtonStyleOptions = {}): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-600',
    secondary:
      'border-brand-200 bg-white text-brand-800 hover:bg-brand-50 focus-visible:ring-brand-600 border',
    // Verde de ayuda. Usa el 700 y no el 600: con texto blanco, `success-600`
    // se queda en 3.3:1 y no cumple AA (UX §27).
    help: 'bg-success-700 text-white shadow-sm hover:bg-success-800 focus-visible:ring-success-700',
    danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-700 focus-visible:ring-danger-600',
    subtle: 'text-closed-600 hover:bg-arena-100 focus-visible:ring-closed-500',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`
}
