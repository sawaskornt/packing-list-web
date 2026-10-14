import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ show: (message: string, type: ToastType) => void }>({
  show: () => {},
});

export function useToast() {
  const { show } = useContext(ToastContext);
  return {
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({ message, type });
    hideTimer.current = setTimeout(() => {
      setToast(null);
    }, 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex justify-center pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg max-w-md text-white text-[13px] font-semibold transition-all ${
              toast.type === 'success' ? 'bg-[#059669]' : 'bg-[#DC2626]'
            }`}
          >
            {toast.type === 'success' ? (
              <Check size={16} color="white" strokeWidth={3} className="shrink-0" />
            ) : (
              <X size={16} color="white" strokeWidth={3} className="shrink-0" />
            )}
            <span className="line-clamp-3">{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
