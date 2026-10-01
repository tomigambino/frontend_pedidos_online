'use client';

import { useEffect, useState } from 'react';
import { getOrderByTracking, type OrderStatus } from '@/lib/api/orders';
import { ApiError } from '@/lib/api/client';
import { clearActiveOrder, readActiveOrder } from '@/lib/utils/active-order';

const TERMINAL: OrderStatus[] = ['ENTREGADO', 'CANCELADO', 'NO_RETIRADO'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  NO_RETIRADO: 'No retirado',
};

export function ActiveOrderBanner({ slug }: { slug: string }) {
  const [order, setOrder] = useState<{ trackingUuid: string; status: OrderStatus } | null>(null);

  useEffect(() => {
    const stored = readActiveOrder(slug);
    if (!stored) return;
    const trackingUuid = stored;

    let cancelled = false;

    async function resolve() {
      let next: { trackingUuid: string; status: OrderStatus };
      try {
        const found = await getOrderByTracking(slug, trackingUuid);
        next = { trackingUuid: found.trackingUuid, status: found.status };
      } catch (err) {
        const isApiError = err instanceof ApiError;
        // 404 → el pedido ya no existe: la key queda obsoleta.
        // red o 5xx (sin status) → no se descarta la key, solo se oculta.
        if (isApiError && err.status === 404) clearActiveOrder(slug);
        return;
      }

      if (TERMINAL.includes(next.status)) {
        clearActiveOrder(slug);
        return;
      }

      if (!cancelled) setOrder(next);
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!order) return null;

  return (
    <div className="sticky top-0 z-50 bg-[var(--color-primary)] text-white">
      <a
        href={`/${slug}/pedido/${order.trackingUuid}`}
        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.99]"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          receipt_long
        </span>
        <span>
          Tenés un pedido {STATUS_LABELS[order.status]} · Ver estado
        </span>
      </a>
    </div>
  );
}