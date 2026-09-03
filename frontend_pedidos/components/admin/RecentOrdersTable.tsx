'use client';

import Link from 'next/link';
import type { OrderResponseDto, OrderStatus } from '@/lib/api/orders';

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

export function RecentOrdersTable({ initialOrders }: { initialOrders: OrderResponseDto[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">Pedidos Recientes</h3>
        <Link href="/admin/pedidos" className="text-primary font-semibold text-sm hover:underline">
          Ver todos
        </Link>
      </div>

      <div>
        {initialOrders.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">No hay pedidos recientes.</p>
        ) : (
          initialOrders.map((order) => (
            <Link
              key={order.id}
              href="/admin/pedidos"
              className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.02] transition-colors border-t border-gray-100 first:border-t-0"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  #{order.id.slice(0, 8).toUpperCase()} · {order.customer.name}
                </p>
                <p className="text-sm text-muted">{order.items.length} productos</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-foreground">{formatPrice(order.total)}</p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_CLASSES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <span className="text-xs text-muted shrink-0 w-14 text-right">
                {timeAgo(order.createdAt)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}