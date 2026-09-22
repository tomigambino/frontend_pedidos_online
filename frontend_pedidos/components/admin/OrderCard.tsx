'use client';

import { useState } from 'react';
import {
  getWhatsappLink,
  updateOrderStatus,
  type DeliveryType,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';
import { ACTIONS, VARIANT_CLASSES } from '@/lib/order-actions';
import { Toast, useToast } from '@/components/admin/Toast';

const TERMINAL_STATES: OrderStatus[] = ['ENTREGADO', 'CANCELADO', 'NO_RETIRADO'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En Preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  NO_RETIRADO: 'No retirado',
};

const BADGE_CLASSES: Record<OrderStatus, string> = {
  PENDIENTE: 'bg-order-new/10 text-order-new',
  EN_PREPARACION: 'bg-order-preparing/10 text-order-preparing',
  LISTO: 'bg-order-ready/10 text-order-ready',
  ENTREGADO: 'bg-order-delivered/10 text-order-delivered',
  CANCELADO: 'bg-status-closed/10 text-status-closed',
  NO_RETIRADO: 'bg-status-closed/10 text-status-closed',
};

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  ENVIO_DOMICILIO: 'Delivery',
  RETIRO_LOCAL: 'Pickup',
};

const MONTHS_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function formatPrice(total: number) {
  return `$${total.toLocaleString('es-AR')}`;
}

function formatClock(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${formatClock(iso)}`;
}

export function OrderCard({
  order,
  tenantSlug,
  onUpdated,
}: {
  order: OrderResponseDto;
  tenantSlug: string;
  onUpdated: (updated: OrderResponseDto) => void;
}) {
  const [loadingNext, setLoadingNext] = useState<OrderStatus | null>(null);
  const [sendingWa, setSendingWa] = useState(false);
  const isTerminal = TERMINAL_STATES.includes(order.status);
  const { toast, show } = useToast();

  async function handleWhatsapp() {
    setSendingWa(true);
    try {
      const { url } = await getWhatsappLink(tenantSlug, order.id);
      window.open(url, '_blank');
    } catch {
      show('No se pudo generar el link de WhatsApp', 'error');
    } finally {
      setSendingWa(false);
    }
  }

  async function handleAction(next: OrderStatus) {
    setLoadingNext(next);
    try {
      const updated = await updateOrderStatus(tenantSlug, order.id, { status: next });
      onUpdated(updated);
    } catch (e) {
      const message =
        e instanceof Error && e.message && e.message !== 'Error desconocido'
          ? e.message
          : 'No se pudo actualizar el pedido';
      show(message, 'error');
    } finally {
      setLoadingNext(null);
    }
  }

  return (
    <>
      <article
      className={`rounded-xl p-6 flex flex-col gap-6 transition-all duration-300 ${
        isTerminal
          ? 'bg-slate-50/50 opacity-75 border border-dashed border-gray-100'
          : 'bg-white border border-gray-100 shadow-sm group hover:shadow-lg hover:translate-y-[-4px]'
      }`}
    >
      <div className="flex justify-between items-start pb-5 border-b border-gray-50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-extrabold text-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${BADGE_CLASSES[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>
            <button
              type="button"
              onClick={handleWhatsapp}
              disabled={sendingWa}
              aria-label="Enviar por WhatsApp"
              title="Enviar por WhatsApp"
              className="ml-1 w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all hover:bg-[#25D366] hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">
                {sendingWa ? 'progress_activity' : 'chat'}
              </span>
            </button>
          </div>
          <p className="text-sm font-medium text-muted flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg">schedule</span>
            {isTerminal
              ? `Finalizado ${formatDateTime(order.updatedAt)}`
              : formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-semibold mb-1 ${isTerminal ? 'text-slate-400' : 'text-primary'}`}>
            {formatPrice(order.total)}
          </p>
          <p className="text-[11px] font-bold text-muted uppercase">
            {DELIVERY_LABELS[order.deliveryType]}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-3">{order.customer.name}</h3>
        <ul className="space-y-2 text-sm text-muted">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <span className="font-bold text-foreground">{item.quantity}x</span>
              {item.name}
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium italic text-primary bg-primary/5 px-3 py-2 rounded-lg">
            <span className="material-symbols-outlined text-base">warning</span>
            {order.notes}
          </p>
        )}
      </div>

      {!isTerminal && (
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS[order.status].map((action) => (
            <button
              key={action.next}
              type="button"
              disabled={loadingNext !== null}
              onClick={() => handleAction(action.next)}
              className={`${VARIANT_CLASSES[action.variant]} flex items-center justify-center gap-2 py-3 rounded-lg font-semibold tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingNext === action.next ? (
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-xl">{action.icon}</span>
              )}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </article>
      <Toast toast={toast} />
    </>
  );
}
