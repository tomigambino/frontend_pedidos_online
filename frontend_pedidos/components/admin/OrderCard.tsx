'use client';

import { useState } from 'react';
import {
  updateOrderStatus,
  type DeliveryType,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';
import { ACTIONS, VARIANT_CLASSES } from '@/lib/order-actions';

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
  const isTerminal = TERMINAL_STATES.includes(order.status);

  async function handleAction(next: OrderStatus) {
    setLoadingNext(next);
    try {
      const updated = await updateOrderStatus(tenantSlug, order.id, { status: next });
      onUpdated(updated);
    } finally {
      setLoadingNext(null);
    }
  }

  return (
    <article
      className={`rounded-xl p-6 flex flex-col transition-all duration-300 ${
        isTerminal
          ? 'bg-slate-50/50 opacity-75 border border-dashed border-gray-100'
          : 'bg-white border border-gray-100 shadow-sm group hover:shadow-lg hover:translate-y-[-4px]'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
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
          </div>
          <p className="text-sm font-semibold tracking-wider text-muted flex items-center gap-1.5">
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
          <p className="text-[11px] font-bold text-muted uppercase tracking-tight">
            {DELIVERY_LABELS[order.deliveryType]}
          </p>
        </div>
      </div>

      <div className="flex-1 mb-8">
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
          <p className="mt-3 flex items-center gap-2 text-sm font-medium italic text-primary">
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
  );
}
