'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getWhatsappLink, type OrderResponseDto, type OrderStatus } from '@/lib/api/orders';
import { Toast, useToast } from '@/components/admin/Toast';

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
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);
  const { toast, show } = useToast();

  async function handleWhatsapp(order: OrderResponseDto) {
    setSendingWaId(order.id);
    try {
      const { url } = await getWhatsappLink(tenantSlug, order.id);
      window.open(url, '_blank');
    } catch {
      show('No se pudo generar el link de WhatsApp', 'error');
    } finally {
      setSendingWaId(null);
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

      <div>
        {initialOrders.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted">No hay pedidos recientes.</p>
        ) : (
          initialOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.02] transition-colors border-t border-gray-100 first:border-t-0"
            >
              <Link href="/admin/pedidos" className="flex flex-1 min-w-0 items-center gap-4">
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
              <button
                type="button"
                onClick={() => handleWhatsapp(order)}
                disabled={sendingWaId === order.id}
                aria-label="Enviar por WhatsApp"
                title="Enviar por WhatsApp"
                className="shrink-0 w-9 h-9 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center transition-all hover:bg-[#25D366] hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-lg">
                  {sendingWaId === order.id ? 'progress_activity' : 'chat'}
                </span>
              </button>
            </div>
          ))
        )}
      </div>
      <Toast toast={toast} />
    </div>
  );
}