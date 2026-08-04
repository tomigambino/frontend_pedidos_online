'use client';

import { useState } from 'react';
import { updateTenant } from '@/lib/api/tenants';

export function StoreStatusToggle({
  initialIsOpen,
  tenantSlug,
}: {
  initialIsOpen: boolean;
  tenantSlug: string;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const previous = isOpen;
    setIsOpen(!isOpen);
    try {
      await updateTenant(tenantSlug, { isOpen: !previous });
    } catch {
      setIsOpen(previous);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-4 flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Estado del Local
        </span>
        <span
          className={`font-bold text-lg flex items-center gap-1 ${
            isOpen ? 'text-status-open' : 'text-status-closed'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isOpen ? 'bg-status-open' : 'bg-status-closed'}`}
          ></span>
          {isOpen ? 'ABIERTO' : 'CERRADO'}
        </span>
      </div>
      <div className="h-10 w-px bg-black/5"></div>
      <button
        type="button"
        role="switch"
        aria-checked={isOpen}
        disabled={loading}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isOpen ? 'bg-status-open' : 'bg-status-closed'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${
            isOpen ? 'translate-x-6' : 'translate-x-1'
          }`}
        ></span>
      </button>
    </div>
  );
}
