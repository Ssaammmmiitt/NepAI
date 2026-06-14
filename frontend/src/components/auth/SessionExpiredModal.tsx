import { Clock } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'

interface SessionExpiredModalProps {
  open: boolean
}

export function SessionExpiredModal({ open }: SessionExpiredModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-desc"
    >
      <div className="absolute inset-0 bg-dt-bg/85 backdrop-blur-[2px]" aria-hidden />
      <div className="relative w-full max-w-sm border border-dt-border bg-dt-surface p-6 text-center shadow-[6px_6px_0_0_var(--dt-shadow)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-dt-negative/40 bg-dt-negative/5">
          <Clock className="h-6 w-6 text-dt-negative" strokeWidth={1.5} />
        </div>
        <h2
          id="session-expired-title"
          className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-dt-text"
        >
          Session Expired
        </h2>
        <p id="session-expired-desc" className="mt-2 text-sm leading-relaxed text-dt-meta">
          Your login session has ended. Sign in again to continue.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Spinner size="sm" />
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-dt-meta">
            Redirecting to login…
          </p>
        </div>
      </div>
    </div>
  )
}
