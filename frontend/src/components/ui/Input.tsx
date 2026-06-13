import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-dt-meta">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`rounded-sm border border-dt-border bg-dt-surface px-4 py-2.5 font-sans text-sm text-dt-text outline-none placeholder:text-dt-meta hover:border-dt-text focus:border-dt-text focus:shadow-[4px_4px_0_0_var(--dt-shadow)] disabled:opacity-40 ${error ? 'border-dt-negative focus:border-dt-negative focus:shadow-[4px_4px_0_0_#B91C1C]' : ''} ${className}`}
        {...props}
      />
      {error ? <p className="text-xs text-dt-negative">{error}</p> : null}
    </div>
  )
}
