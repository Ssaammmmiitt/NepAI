import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-dt-bg/80"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md border border-dt-border bg-dt-surface p-6 shadow-[6px_6px_0_0_var(--dt-shadow)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.06em] text-dt-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1 text-dt-meta hover:text-dt-text"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
