import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore, type Toast as ToastType } from '@stores/toastStore';
import { cn } from '@lib/utils/cn';

interface ToastProps {
  toast: ToastType;
}

const icons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const styles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export function Toast({ toast }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const removeToast = useToastStore((state) => state.removeToast);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 150);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
        'min-w-[300px] max-w-md',
        'animate-in slide-in-from-right',
        isExiting && 'opacity-0 transition-opacity duration-150',
        styles[toast.type]
      )}
      role="alert"
    >
      <span className="flex-shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
