'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateOrderStatus,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';
import { ACTIONS, VARIANT_CLASSES } from '@/lib/order-actions';

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

function formatPrice(total: number) {
  return `$${total.toLocaleString('es-AR')}`;
}

export function RecentOrdersTable({
  initialOrders,
  tenantSlug,
}: {
  initialOrders: OrderResponseDto[];
  tenantSlug: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [prevInitial, setPrevInitial] = useState(initialOrders);
  const [loading, setLoading] = useState<{ orderId: string; next: OrderStatus } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (initialOrders !== prevInitial) {
    setPrevInitial(initialOrders);
    setOrders(initialOrders);
  }

  async function handleAction(orderId: string, next: OrderStatus) {
    setLoading({ orderId, next });
    setError(null);
    try {
      const updated = await updateOrderStatus(tenantSlug, orderId, { status: next });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">Pedidos Recientes</h3>
        <Link href="/admin/pedidos" className="text-primary font-semibold text-sm hover:underline">
          Ver todos
        </Link>
      </div>

      {error && (
        <p role="alert" className="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-muted uppercase tracking-wider">
                Pedido
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-muted uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-muted uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-muted uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-muted uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted">
                  No hay pedidos recientes.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const rowLoading = loading?.orderId === order.id;
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-muted">{timeAgo(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{order.customer.name}</td>
                    <td className="px-6 py-4 font-bold">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${BADGE_CLASSES[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {ACTIONS[order.status].map((action) => {
                          const isCurrent =
                            loading?.orderId === order.id && loading.next === action.next;
                          return (
                            <button
                              key={action.next}
                              type="button"
                              disabled={rowLoading}
                              onClick={() => handleAction(order.id, action.next)}
                              className={`${VARIANT_CLASSES[action.variant]} px-3 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                            >
                              {isCurrent && (
                                <span className="material-symbols-outlined text-sm animate-spin">
                                  progress_activity
                                </span>
                              )}
                              {action.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
