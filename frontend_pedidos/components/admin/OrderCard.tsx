'use client';

import { useState } from 'react';
import {
  getWhatsappLink,
  updateOrderStatus,
  type DeliveryType,
  type OrderResponseDto,
  type OrderStatus,
  type PaymentMethod,
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
  ENVIO_DOMICILIO: 'Envío a domicilio',
  RETIRO_LOCAL: 'Retiro en local',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA_DEBITO: 'Tarjeta de débito',
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
          <p className="text-[11px] font-bold text-muted/80 flex items-center justify-end gap-1 mt-0.5">
            <span className="material-symbols-outlined text-sm">payments</span>
            {PAYMENT_LABELS[order.paymentMethod]}
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
        <div className="flex items-center gap-3">
          {ACTIONS[order.status].map((action) => (
            <button
              key={action.next}
              type="button"
              disabled={loadingNext !== null}
              onClick={() => handleAction(action.next)}
              className={`${VARIANT_CLASSES[action.variant]} ${
                action.variant === 'danger'
                  ? 'flex-shrink-0 px-3 gap-1.5 text-sm'
                  : 'flex-1'
              } flex items-center justify-center gap-2 py-3 rounded-lg font-semibold tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingNext === action.next ? (
                <span className="material-symbols-outlined text-lg animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className={`material-symbols-outlined ${
                  action.variant === 'danger' ? 'text-lg' : 'text-xl'
                }`}>{action.icon}</span>
              )}
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleWhatsapp}
            disabled={sendingWa}
            aria-label="Enviar por WhatsApp"
            title="Enviar por WhatsApp"
            className="flex-shrink-0 h-12 w-12 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all hover:bg-[#25D366] hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center">
              {sendingWa ? (
                <span className="material-symbols-outlined text-xl animate-spin">
                  progress_activity
                </span>
              ) : (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
                </svg>
              )}
            </span>
          </button>
        </div>
      )}
    </article>
      <Toast toast={toast} />
    </>
  );
}
