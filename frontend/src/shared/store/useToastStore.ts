import { create } from "zustand"
import type { ToastVariant } from "@/presentation/components/ui/Toast"

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
}

interface ToastState {
  toasts: Toast[]
  showToast: (message: string, variant?: ToastVariant) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  showToast: (message: string, variant: ToastVariant = "success") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }))
  },

  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
}))
