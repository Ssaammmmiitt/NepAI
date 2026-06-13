import type { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 ${className}`}>
      {children}
    </div>
  )
}
