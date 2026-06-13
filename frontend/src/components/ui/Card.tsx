import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  hover?: boolean
}

export function Card({ children, className = '', title, action, hover }: CardProps) {
  return (
    <div className={`dt-card ${hover ? 'dt-card-hover' : ''} ${className}`}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="dt-eyebrow">{title}</h3> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </div>
  )
}
