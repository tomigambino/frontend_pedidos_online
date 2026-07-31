'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type OrderResponseDto } from '@/lib/api/orders';
import { type TenantConfigResponseDto } from '@/lib/api/tenants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STEPS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'] as const;
const TERMINAL_NEGATIVE = ['CANCELADO', 'NO_RETIRADO'];

const STEP_ICONS: Record<string, string> = {
  PENDIENTE: 'receipt_long',
  EN_PREPARACION: 'restaurant',
  LISTO: 'task_alt',
  ENTREGADO: 'handshake',
};

const STEP_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
};

const STATUS_INFO: Record<string, { title: string; description: string }> = {
  PENDIENTE: { title: 'Pedido recibido', description: 'Estamos procesando tu pedido.' },
  EN_PREPARACION: { title: 'Preparando tu pedido', description: 'Estamos preparando tus productos con los mejores ingredientes.' },
  LISTO: { title: 'Pedido listo', description: 'Tu pedido está listo.' },
  ENTREGADO: { title: 'Pedido entregado', description: 'Gracias por tu compra.' },
};

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

function getTodaySchedule(
  regular: { dayOfWeek: number; openingTime: string; closingTime: string }[],
) {
  const dayIndex = (new Date().getDay() + 6) % 7 + 1;
  const today = regular.find((s) => s.dayOfWeek === dayIndex);
  if (!today) return null;
  return {
    openingTime: today.openingTime.slice(0, 5),
    closingTime: today.closingTime.slice(0, 5),
  };
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

function formatScheduleRange(
  regular: { dayOfWeek: number; openingTime: string; closingTime: string }[],
): string {
  if (regular.length === 0) return '';
  const sorted = [...regular].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const range = `${DAY_NAMES[first.dayOfWeek]} - ${DAY_NAMES[last.dayOfWeek]}`;
  return `${range}: ${first.openingTime.slice(0, 5)} - ${first.closingTime.slice(0, 5)}`;
}

export function PedidoContent({
  slug,
  order: initialOrder,
  tenant,
}: {
  slug: string;
  order: OrderResponseDto;
  tenant: TenantConfigResponseDto;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialOrder.status);

  const isTerminalNegative = TERMINAL_NEGATIVE.includes(status);
  const isTerminal = status === 'ENTREGADO' || isTerminalNegative;
  const currentStepIndex = STEPS.indexOf(status as typeof STEPS[number]);
  const trackingCode = initialOrder.trackingUuid.slice(0, 8).toUpperCase();

  const todaySchedule = getTodaySchedule(tenant.schedule.regular);
  const scheduleLabel = todaySchedule
    ? `${todaySchedule.openingTime} - ${todaySchedule.closingTime}`
    : formatScheduleRange(tenant.schedule.regular);

  useEffect(() => {
    if (isTerminal) return;

    const url = `${API_URL}/${slug}/orders/${initialOrder.trackingUuid}/status-stream`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const newStatus = event.data;
      setStatus(newStatus);
      if (newStatus === 'ENTREGADO' || TERMINAL_NEGATIVE.includes(newStatus)) {
        es.close();
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [slug, initialOrder.trackingUuid, isTerminal]);

  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, []);

  const whatsappMessage = tenant.whatsapp
    ? `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
        `¡Hola! Quisiera consultar sobre mi pedido ${trackingCode} (${tenant.name}).`,
      )}`
    : null;

  const statusInfo = STATUS_INFO[status] ?? { title: 'Estado actual', description: '' };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center p-4 pb-2 justify-between">
          <a
            href={`/${slug}/menu`}
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

      <main className="flex-1 px-4 py-6 pb-36 max-w-lg mx-auto w-full">
        {isTerminalNegative ? (
          <section className="mb-6">
            <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 text-center">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-4 block">
                {status === 'CANCELADO' ? 'cancel' : 'do_not_disturb_on'}
              </span>
              <h2 className="text-[var(--color-foreground)] text-xl font-bold mb-2">
                {status === 'CANCELADO' ? 'Pedido cancelado' : 'No retirado'}
              </h2>
              {initialOrder.cancellationReason && (
                <p className="text-[var(--color-muted)] text-sm">
                  {initialOrder.cancellationReason}
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0" />
                <div
                  className="absolute top-5 left-0 h-[2px] bg-[var(--color-primary)] -z-0 transition-all"
                  style={{
                    width: currentStepIndex >= 0
                      ? `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                      : '0%',
                  }}
                />
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentStepIndex;
                  const isActive = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                          isCompleted || isActive
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-gray-100 text-[var(--color-muted)]'
                        }`}
                      >
                        {isCompleted ? (
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            check
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">
                            {STEP_ICONS[step]}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-[var(--color-primary)]/30" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${
                          isActive
                            ? 'text-[var(--color-primary)]'
                            : isCompleted
                              ? 'text-[var(--color-foreground)]'
                              : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <h2 className="text-[var(--color-foreground)] text-xl font-bold mb-2">
                  {statusInfo.title}
                </h2>
                <p className="text-[var(--color-muted)] text-sm">{statusInfo.description}</p>
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-1">
              SEGUIMIENTO
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[var(--color-foreground)] font-bold text-lg">
                #{trackingCode}
              </p>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-primary)]">
                  content_copy
                </span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-1">
              CLIENTE
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">
                  person
                </span>
              </div>
              <p className="text-[var(--color-foreground)] font-semibold text-sm truncate">
                {initialOrder.customer.name}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 mb-4">
          <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-2">
            {initialOrder.deliveryType === 'ENVIO_DOMICILIO' ? 'DIRECCIÓN DE ENTREGA' : 'RETIRO EN LOCAL'}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                location_on
              </span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] text-sm">
                {initialOrder.deliveryType === 'ENVIO_DOMICILIO'
                  ? initialOrder.delivery?.address ?? 'Dirección no especificada'
                  : `Retirás en ${tenant.address || 'el local'}`}
              </p>
              {initialOrder.delivery?.notes && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {initialOrder.delivery.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[var(--color-foreground)] font-bold text-base">
                Resumen del Pedido
              </h3>
              <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {initialOrder.items.length} {initialOrder.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {initialOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[var(--color-muted)] text-xl">
                        restaurant
                      </span>
                    </div>
                    <div>
                      <p className="text-[var(--color-foreground)] text-sm font-semibold">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatPrice(item.price)} c/u
                      </p>
                    </div>
                  </div>
                  <span className="text-[var(--color-foreground)] text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <span className="text-[var(--color-foreground)] font-bold text-base">Total</span>
              <span className="text-xl font-extrabold text-[var(--color-primary)]">
                {formatPrice(initialOrder.total)}
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="bg-white rounded-xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <h3 className="text-[var(--color-foreground)] font-bold text-base mb-4">
              Información del Negocio
            </h3>
            {tenant.address && (
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    location_on
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest">
                    DIRECCIÓN DEL LOCAL
                  </p>
                  <p className="text-[var(--color-foreground)] text-sm">{tenant.address}</p>
                </div>
              </div>
            )}
            {scheduleLabel && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    schedule
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest">
                    HORARIO DE ATENCIÓN
                  </p>
                  <p className="text-[var(--color-foreground)] text-sm">{scheduleLabel}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {showCopied && (
        <div className="fixed top-20 left-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg toast-fade">
          Seguimiento copiado correctamente
        </div>
      )}

      <style>{`
        .toast-fade {
          animation: toastFade 2s ease-in-out forwards;
        }
        @keyframes toastFade {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          75% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>

      {whatsappMessage && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <a
              href={whatsappMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all hover:brightness-105"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.522-2.961-2.638-.087-.117-.708-.941-.708-1.793s.437-1.272.593-1.442c.156-.17.34-.213.453-.213.114 0 .227.001.326.005.102.005.242-.038.379.293.144.35.492 1.2.534 1.285.043.085.07.184.014.3-.057.115-.085.184-.17.284-.085.101-.178.225-.255.302-.085.085-.174.178-.075.35.099.17.442.729.948 1.18.653.58 1.203.761 1.374.846.171.085.271.071.371-.043.101-.114.425-.494.538-.664.113-.17.227-.142.384-.085.156.057 1.002.473 1.171.558.17.085.284.127.326.199.042.072.042.417-.102.822z" />
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5c-4.694 0-8.5 3.806-8.5 8.5 0 1.503.39 2.973 1.134 4.269l-1.191 4.354 4.463-1.172c1.24.717 2.66 1.049 4.094 1.049 4.694 0 8.5-3.806 8.5-8.5s-3.806-8.5-8.5-8.5z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
