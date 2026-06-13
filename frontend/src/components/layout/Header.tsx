import type { ReactNode } from 'react'
import { LiveClock } from '@/components/widgets/LiveClock'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="border-b border-dt-border bg-dt-surface px-4 py-3 sm:px-5 sm:py-4 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-mono text-lg font-bold uppercase tracking-[0.06em] text-dt-text sm:text-xl lg:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-dt-meta sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {action ? (
            <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto [&_input]:w-full sm:[&_input]:w-auto">
              {action}
            </div>
          ) : null}
          <LiveClock />
        </div>
      </div>
    </header>
  )
}
