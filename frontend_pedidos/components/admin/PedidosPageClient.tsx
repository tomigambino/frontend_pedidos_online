'use client';

import { useCallback, useEffect, useState } from 'react';
import { PedidosFiltersBar } from '@/components/admin/PedidosFiltersBar';
import { PedidosGrid } from '@/components/admin/PedidosGrid';
import { CreateOrderModal } from '@/components/admin/CreateOrderModal';
import { OrderPrintDialog } from '@/components/admin/OrderPrintDialog';
import { Toast, useToast } from '@/components/admin/Toast';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import {
  getOrderCounts,
  getOrdersFiltered,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';
import { getProducts, type ProductResponseDto } from '@/lib/api/products';
import { getCategories, type CategoryResponseDto } from '@/lib/api/categories';
import type { TenantConfigResponseDto } from '@/lib/api/tenants';

const POLL_INTERVAL_MS = 20000;

export function PedidosPageClient({
  initialOrders,
  initialCounts,
  tenantSlug,
  tenant,
  autoCreate = false,
}: {
  initialOrders: OrderResponseDto[];
  initialCounts: Record<OrderStatus, number>;
  tenantSlug: string;
  tenant: TenantConfigResponseDto;
  autoCreate?: boolean;
}) {
  const filtersHook = usePedidosFilters();
  const { search, dateFrom, dateTo, status } = filtersHook;
  const [orders, setOrders] = useState(initialOrders);
  const [counts, setCounts] = useState(initialCounts);
  const [createOpen, setCreateOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<OrderResponseDto | null>(null);
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const { toast, show } = useToast();

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
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  const openCreateOrder = useCallback(async () => {
    setCreateOpen(true);
    setProductsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(tenantSlug),
        getCategories(tenantSlug),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      show('No se pudieron cargar los productos', 'error');
    } finally {
      setProductsLoading(false);
    }
  }, [tenantSlug, show]);

  useEffect(() => {
    if (!autoCreate) return;
    const timeout = setTimeout(() => {
      void openCreateOrder();
    }, 0);
    return () => clearTimeout(timeout);
  }, [autoCreate, openCreateOrder]);

  function handleCreated() {
    show('Pedido creado correctamente');
    fetchData();
  }

  return (
    <>
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Pedidos</h2>
          <p className="text-muted">Control en tiempo real del flujo de cocina.</p>
        </div>
        <button
          type="button"
          onClick={openCreateOrder}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Crear pedido
        </button>
      </section>

      <PedidosFiltersBar filtersHook={filtersHook} counts={counts} />
      <PedidosGrid
        initialOrders={orders}
        tenantSlug={tenantSlug}
        onOrderUpdated={fetchData}
        onPrint={setPrintOrder}
      />

      {createOpen && (
        <CreateOrderModal
          slug={tenantSlug}
          products={products}
          categories={categories}
          loading={productsLoading}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {printOrder && (
        <OrderPrintDialog
          order={printOrder}
          tenant={tenant}
          onClose={() => setPrintOrder(null)}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
