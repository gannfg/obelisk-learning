"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ toast, onClose }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isRemoving, setIsRemoving] = React.useState(false);

    React.useEffect(() => {
      // Trigger animation
      setTimeout(() => setIsVisible(true), 10);

      // Auto-dismiss
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsRemoving(true);
          setTimeout(() => {
            onClose(toast.id);
          }, 300);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [toast.duration, toast.id, onClose]);

    const handleClose = () => {
      setIsRemoving(true);
      setTimeout(() => {
        onClose(toast.id);
      }, 300); // Match animation duration
    };

    const icons = {
      success: CheckCircle2,
      error: AlertCircle,
      info: Info,
      warning: AlertTriangle,
    };

    const styles = {
      success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
      error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
      info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
    };

    const iconColors = {
      success: "text-green-600 dark:text-green-400",
      error: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
      warning: "text-yellow-600 dark:text-yellow-400",
    };

    const Icon = icons[toast.type];

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
          styles[toast.type],
          isVisible && !isRemoving
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0",
          isRemoving && "translate-x-full opacity-0"
        )}
        role="alert"
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColors[toast.type])} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{toast.title}</div>
          {toast.message && (
            <div className="text-sm mt-1 opacity-90">{toast.message}</div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
ToastComponent.displayName = "Toast";

export { ToastComponent };
