'use client';

import { useCallback, useState } from 'react';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 pl-3 pr-4 py-3 rounded-lg bg-white shadow-lg shadow-black/10 ring-1 ring-black/5 max-w-sm">
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
          isSuccess ? 'bg-status-open/15 text-status-open' : 'bg-red-600/15 text-red-600'
        }`}
      >
        <span className="material-symbols-outlined text-[15px]">
          {isSuccess ? 'check' : 'close'}
        </span>
      </span>
      <p className="text-sm font-medium text-foreground">{toast.message}</p>
    </div>
  );
}