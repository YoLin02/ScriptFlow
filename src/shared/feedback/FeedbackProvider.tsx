import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface FeedbackContextValue {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const toast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmOptions(options);
    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
    });
  }, []);

  const resolveConfirm = (value: boolean) => {
    confirmResolverRef.current?.(value);
    confirmResolverRef.current = null;
    setConfirmOptions(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="fixed right-4 bottom-4 z-[10000] flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto min-w-56 max-w-80 rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 ${
              item.tone === 'error'
                ? 'border-red-100 text-red-700'
                : item.tone === 'success'
                  ? 'border-green-100 text-green-700'
                  : 'border-neutral-200 text-neutral-700'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>

      {confirmOptions && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950/35 backdrop-blur-xs">
          <div className="w-80 max-w-[92vw] rounded-xl border border-neutral-200 bg-white p-5 text-neutral-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-semibold text-neutral-950">{confirmOptions.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-550">{confirmOptions.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold text-neutral-650 transition-colors hover:bg-neutral-50"
              >
                {confirmOptions.cancelText || '取消'}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition-colors ${
                  confirmOptions.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-950 hover:bg-neutral-800'
                }`}
              >
                {confirmOptions.confirmText || '确定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used inside FeedbackProvider');
  }
  return context;
}
