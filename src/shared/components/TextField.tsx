import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Mensaje de error legible asociado al input (UX §25). */
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, id, name, className, ...rest }: TextFieldProps) {
  const inputId = id ?? name
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-closed-700 text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-closed-100 disabled:opacity-60 ${
          error
            ? 'border-danger-500 focus:ring-danger-500'
            : 'border-closed-100 focus:border-brand-500 focus:ring-brand-500'
        } ${className ?? ''}`}
        {...rest}
      />
      {!error && hint ? (
        <p id={`${inputId}-hint`} className="text-closed-500 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-danger-600 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
