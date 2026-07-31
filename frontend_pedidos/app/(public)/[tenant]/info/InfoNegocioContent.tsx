'use client';

import { type TenantConfigResponseDto } from '@/lib/api/tenants';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { buildWeekSchedule } from '@/lib/utils/schedule';

export function InfoNegocioContent({
  slug,
  tenant,
}: {
  slug: string;
  tenant: TenantConfigResponseDto;
}) {
  const weekSchedule = buildWeekSchedule(tenant.schedule.regular, tenant.schedule.exceptions);
  const today = weekSchedule.find((d) => d.isToday);
  const scheduleLabel =
  today && today.isOpen && today.slots.length > 0
    ? today.slots.map((s) => `${s.openingTime}–${s.closingTime}`).join(', ')
    : null;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[var(--color-background)]">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center p-4 pb-2 justify-between">
          <a
            href={`/${slug}`}
            className="flex size-12 shrink-0 items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[var(--color-foreground)]">
              arrow_back
            </span>
          </a>
          <h2 className="text-[var(--color-foreground)] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {tenant.name}
          </h2>
          <div className="flex w-12 items-center justify-end" />
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="relative w-40 h-40 md:w-52 md:h-52 mb-6 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white flex items-center justify-center bg-white">
              {tenant.logo ? (
                <img
                  className="w-full h-full object-cover"
                  src={tenant.logo}
                  alt={tenant.name}
                />
              ) : (
                <span
                  className="material-symbols-outlined text-[var(--color-primary)] text-6xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  store
                </span>
              )}
            </div>

            <h1 className="text-4xl font-extrabold text-[var(--color-foreground)] tracking-tight mb-3">
              {tenant.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <StatusBadge isOpen={tenant.isOpen} scheduleLabel={scheduleLabel} />
              {tenant.deliveryCostEnabled && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--color-primary)]/5 text-[var(--color-primary)] rounded-full text-sm font-semibold tracking-wider">
                  <span className="material-symbols-outlined text-sm">
                    delivery_dining
                  </span>
                  Envío a domicilio
                </span>
              )}
            </div>

            {tenant.description && (
              <p className="text-[var(--color-muted)] text-lg max-w-md">
                {tenant.description}
              </p>
            )}

            {tenant.whatsapp && (
              <a
                href={`https://wa.me/${tenant.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white px-8 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined">chat</span>
                WhatsApp Directo
              </a>
            )}
          </div>

          <div className="md:col-span-7">
            {tenant.address && (
              <div className="bg-white p-6 rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[var(--color-primary)]/10 w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                    <h3 className="text-[var(--color-foreground)] font-bold text-lg leading-tight">
                      Ubicación
                    </h3>
                    <p className="text-[var(--color-muted)]">{tenant.address}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[var(--color-primary)] font-semibold hover:underline w-fit"
                >
                  <span>Abrir en Maps</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <section className="bg-gray-50 p-6 md:p-10 rounded-[2.5rem] border border-white">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="bg-[var(--color-primary)] w-12 h-12 rounded-2xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <h2 className="text-[var(--color-foreground)] text-2xl font-bold leading-tight tracking-[-0.015em]">
                Horarios de Atención
              </h2>
            </div>
            <span className="hidden md:block text-[var(--color-muted)] text-xs font-semibold uppercase tracking-widest">
              Lunes a Domingo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {weekSchedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`relative p-5 rounded-2xl border transition-all ${
                  day.isToday
                    ? 'bg-white shadow-sm border-2 border-[var(--color-primary)]'
                    : 'bg-white/60 hover:bg-white border-gray-200'
                }`}
              >
                {day.isToday && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-[var(--color-primary)] text-white rounded-bl-xl text-[10px] font-bold tracking-wider">
                    HOY
                  </div>
                )}
                <span
                  className={`block mb-2 text-xs font-semibold tracking-wider uppercase ${
                    day.isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
                  }`}
                >
                  {day.label}
                </span>
                <span className="text-[var(--color-foreground)] font-bold flex flex-col gap-0.5">
                  {day.isOpen && day.slots.length > 0
                    ? day.slots.map((slot, i) => (
                        <span key={i}>{slot.openingTime} - {slot.closingTime}</span>
                      ))
                    : 'Cerrado'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
