import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-dt-btn-primary-bg text-dt-btn-primary-fg border border-transparent font-bold uppercase tracking-[0.06em] hover:shadow-[4px_4px_0_0_var(--dt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-40',
  secondary:
    'bg-dt-btn-secondary-bg text-dt-accent-bright border border-dt-accent-bright font-semibold uppercase tracking-[0.06em] hover:shadow-[4px_4px_0_0_var(--dt-shadow)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-40',
  outline:
    'bg-transparent text-dt-meta border border-dt-border-strong font-medium uppercase tracking-[0.06em] hover:border-dt-text hover:text-dt-text disabled:opacity-40',
  ghost:
    'bg-transparent text-dt-accent-bright border-none font-medium px-0 hover:underline disabled:opacity-40',
  danger:
    'bg-dt-negative text-white border border-transparent font-bold uppercase tracking-[0.06em] disabled:opacity-40',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-sm px-5 py-2.5 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-dt-text disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  )
}
