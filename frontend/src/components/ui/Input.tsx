import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, type, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && visible ? 'text' : type

  const inputClassName = `w-full rounded-sm border border-dt-border bg-dt-surface px-4 py-2.5 font-sans text-sm text-dt-text outline-none placeholder:text-dt-meta hover:border-dt-text focus:border-dt-text focus:shadow-[4px_4px_0_0_var(--dt-shadow)] disabled:opacity-40 ${error ? 'border-dt-negative focus:border-dt-negative focus:shadow-[4px_4px_0_0_#B91C1C]' : ''} ${isPassword ? 'pr-11' : ''} ${className}`

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-dt-meta">
          {label}
        </label>
      ) : null}
      {isPassword ? (
        <div className="relative">
          <input id={inputId} type={inputType} className={inputClassName} {...props} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-dt-meta hover:text-dt-text"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      ) : (
        <input id={inputId} type={type} className={inputClassName} {...props} />
      )}
      {error ? <p className="text-xs text-dt-negative">{error}</p> : null}
    </div>
  )
}
