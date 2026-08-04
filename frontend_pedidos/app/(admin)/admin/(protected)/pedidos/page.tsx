import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PedidosPageClient } from '@/components/admin/PedidosPageClient';
import { getMe, type AdminSession } from '@/lib/api/auth';
import { today } from '@/lib/dates';
import { getOrderCounts, getOrdersFiltered } from '@/lib/api/orders';

export default async function PedidosPage() {
  const cookie = (await cookies()).toString();

  let session: AdminSession;
  try {
    session = await getMe(cookie);
  } catch {
    redirect('/admin/login');
  }

  const date = today();
  const [orders, counts] = await Promise.all([
    getOrdersFiltered(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
    getOrderCounts(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Gestión de Pedidos</h2>
        <p className="text-muted">Control en tiempo real del flujo de cocina.</p>
      </section>
      <PedidosPageClient
        initialOrders={orders.data}
        initialCounts={counts}
        tenantSlug={session.tenantSlug}
      />
    </div>
  );
}
