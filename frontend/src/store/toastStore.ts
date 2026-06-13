import { create } from 'zustand'

export type ToastVariant = 'success' | 'error'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

const AUTO_DISMISS_MS = 3200

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, variant = 'success') => {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { id, message, variant }] })
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS)
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
}))
