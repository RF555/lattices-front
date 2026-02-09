import { create } from 'zustand';
import { TOAST } from '@/constants';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss after duration
    const duration = toast.duration ?? TOAST.DEFAULT_DURATION_MS;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Convenience functions
export const toast = {
  success: (message: string) => {
    useToastStore.getState().addToast({ type: 'success', message });
  },
  error: (message: string) => {
    useToastStore
      .getState()
      .addToast({ type: 'error', message, duration: TOAST.ERROR_DURATION_MS });
  },
  info: (message: string) => {
    useToastStore.getState().addToast({ type: 'info', message });
  },
  warning: (message: string) => {
    useToastStore.getState().addToast({ type: 'warning', message });
  },
};
