'use client';

import { useMemo, useState } from 'react';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import { Toast, useToast } from '@/components/admin/Toast';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export function MenuLinkSection() {
  const { tenantSlug } = useAdminSession();
  const { toast, show } = useToast();
  const [copied, setCopied] = useState(false);

  const menuUrl = useMemo(() => {
    const base =
      APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/${tenantSlug}`;
  }, [tenantSlug]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      show('Link copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      show('No se pudo copiar el link', 'error');
    }
  }

  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary">link</span>
        <h2 className="text-lg font-bold text-foreground">Link del Menú</h2>
      </div>
      <p className="text-sm text-muted mb-4">
        Compartí este link con tus clientes para que vean tu menú y hagan pedidos.
      </p>
      <div className="flex items-center gap-3">
        <input
          readOnly
          value={menuUrl}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 px-4 py-3 bg-black/5 border border-black/15 rounded-xl font-mono text-sm text-foreground cursor-default focus:outline-none focus:ring-0"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-primary text-primary font-semibold transition-all hover:bg-primary/10 active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">open_in_new</span>
          Abrir
        </a>
      </div>
      <Toast toast={toast} />
    </section>
  );
}