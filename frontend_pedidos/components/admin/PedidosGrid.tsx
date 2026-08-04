'use client';

import { useState } from 'react';
import type { OrderResponseDto } from '@/lib/api/orders';
import { OrderCard } from './OrderCard';

export function PedidosGrid({
  initialOrders,
  tenantSlug,
  onOrderUpdated,
}: {
  initialOrders: OrderResponseDto[];
  tenantSlug: string;
  onOrderUpdated: () => void;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [prevInitial, setPrevInitial] = useState(initialOrders);

  if (initialOrders !== prevInitial) {
    setPrevInitial(initialOrders);
    setOrders(initialOrders);
  }

  function handleUpdated(updated: OrderResponseDto) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    onOrderUpdated();
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-100 p-12 text-center">
        <p className="text-muted font-semibold">No hay pedidos con estos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          tenantSlug={tenantSlug}
          onUpdated={handleUpdated}
        />
      ))}
    </div>
  );
}
