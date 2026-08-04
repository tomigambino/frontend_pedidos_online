'use client';

import { useCallback, useEffect, useState } from 'react';
import { PedidosFiltersBar } from '@/components/admin/PedidosFiltersBar';
import { PedidosGrid } from '@/components/admin/PedidosGrid';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import {
  getOrderCounts,
  getOrdersFiltered,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';

const POLL_INTERVAL_MS = 20000;

export function PedidosPageClient({
  initialOrders,
  initialCounts,
  tenantSlug,
}: {
  initialOrders: OrderResponseDto[];
  initialCounts: Record<OrderStatus, number>;
  tenantSlug: string;
}) {
  const filtersHook = usePedidosFilters();
  const { search, dateFrom, dateTo, status } = filtersHook;
  const [orders, setOrders] = useState(initialOrders);
  const [counts, setCounts] = useState(initialCounts);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, countsRes] = await Promise.all([
        getOrdersFiltered(tenantSlug, { search, dateFrom, dateTo, status }),
        getOrderCounts(tenantSlug, { search, dateFrom, dateTo }),
      ]);
      setOrders(ordersRes.data);
      setCounts(countsRes);
    } catch {
      // mantener datos actuales; el próximo poll reintenta
    }
  }, [tenantSlug, search, dateFrom, dateTo, status]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <PedidosFiltersBar filtersHook={filtersHook} counts={counts} />
      <PedidosGrid initialOrders={orders} tenantSlug={tenantSlug} onOrderUpdated={fetchData} />
    </>
  );
}
