'use client';

import { useState } from 'react';

type ToastState = { message: string; type: 'success' | 'error' } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  function show(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return { toast, show };
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg bg-white shadow-md border-l-4 max-w-sm transition-all ${
        isSuccess ? 'border-status-open' : 'border-red-600'
      }`}
    >
      <span
        className={`material-symbols-outlined text-xl ${
          isSuccess ? 'text-status-open' : 'text-red-600'
        }`}
      >
        {isSuccess ? 'check_circle' : 'error'}
      </span>
      <p className="text-sm text-foreground">{toast.message}</p>
    </div>
  );
}