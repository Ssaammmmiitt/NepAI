import { CheckCircle2, X, XCircle } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

const variantStyles = {
  success: {
    border: 'border-l-dt-accent-bright',
    icon: CheckCircle2,
    iconClass: 'text-dt-accent-bright',
  },
  error: {
    border: 'border-l-dt-negative',
    icon: XCircle,
    iconClass: 'text-dt-negative',
  },
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-16 right-3 z-50 flex w-[min(100%,18rem)] flex-col gap-2 sm:right-4 sm:w-80 lg:bottom-4"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = variantStyles[toast.variant]
        const Icon = style.icon

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 border border-dt-border border-l-4 ${style.border} bg-dt-surface px-3 py-2.5 shadow-[4px_4px_0_0_var(--dt-shadow)]`}
            role="status"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} strokeWidth={1.5} />
            <p className="flex-1 font-mono text-xs font-medium uppercase tracking-[0.06em] text-dt-text">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="cursor-pointer shrink-0 text-dt-meta hover:text-dt-text"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
