// Adapté de shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import React from "react";
import { useState, useCallback } from "react";

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

export type Toast = {
  id: string;
  props: ToastProps;
  onClose: () => void;
};

const TOAST_TIMEOUT = 5000;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = TOAST_TIMEOUT }: ToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = {
        id,
        props: { title, description, variant, duration },
        onClose: () => setToasts((toasts) => toasts.filter((t) => t.id !== id))
      };

      setToasts((toasts) => [...toasts, newToast]);

      if (duration !== Infinity) {
        setTimeout(() => {
          setToasts((toasts) => toasts.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    [setToasts]
  );

  const dismiss = useCallback((id: string) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
}
