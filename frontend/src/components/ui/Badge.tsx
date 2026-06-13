import type { ReactNode } from 'react'

type Variant = 'positive' | 'negative' | 'warning' | 'neutral' | 'info'

interface BadgeProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

const variants: Record<Variant, string> = {
  positive: 'border-dt-accent-bright text-dt-accent-bright bg-dt-accent-bright/10',
  negative: 'border-dt-negative text-dt-negative bg-dt-negative/10',
  warning: 'border-dt-meta text-dt-meta bg-dt-bg',
  neutral: 'border-dt-border text-dt-meta bg-dt-bg',
  info: 'border-dt-accent text-dt-accent bg-dt-accent/10',
}

export function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
