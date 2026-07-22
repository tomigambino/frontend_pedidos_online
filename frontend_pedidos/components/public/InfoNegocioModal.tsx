'use client';

import { useState } from 'react';
import type { TenantConfigResponseDto } from '@/lib/api/tenants';

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function InfoNegocioModal({ tenant }: { tenant: TenantConfigResponseDto }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="block -mt-8 mb-8 text-white/70 hover:text-white text-sm font-medium transition-colors underline underline-offset-4"
      >
        Ver info del negocio
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                {tenant.name}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {tenant.address && (
                <div>
                  <p className="text-sm text-[var(--color-muted)]">Dirección</p>
                  <p className="text-[var(--color-foreground)]">{tenant.address}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-[var(--color-muted)]">Horarios</p>
                <div className="space-y-1 mt-1">
                  {tenant.schedule.regular.map((s) => (
                    <p key={s.id} className="text-[var(--color-foreground)] text-sm">
                      {DAY_NAMES[s.dayOfWeek - 1]}: {s.openingTime}–{s.closingTime}
                    </p>
                  ))}
                  {tenant.schedule.regular.length === 0 && (
                    <p className="text-[var(--color-muted)] text-sm">No disponible</p>
                  )}
                </div>
              </div>

              {tenant.whatsapp && (
                <div>
                  <p className="text-sm text-[var(--color-muted)]">WhatsApp</p>
                  <a
                    href={`https://wa.me/${tenant.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {tenant.whatsapp}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
