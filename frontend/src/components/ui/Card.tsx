import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
  hover?: boolean
}

export function Card({ children, className = '', title, description, action, hover }: CardProps) {
  return (
    <div className={`dt-card ${hover ? 'dt-card-hover' : ''} ${className}`}>
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          {title ? (
            <div className="min-w-0">
              <h3 className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-dt-text sm:text-base">
                {title}
              </h3>
              {description ? (
                <p className="mt-1 text-xs leading-relaxed text-dt-meta">{description}</p>
              ) : null}
            </div>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </div>
  )
}
