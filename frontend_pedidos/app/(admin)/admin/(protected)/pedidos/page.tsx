import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PedidosPageClient } from '@/components/admin/PedidosPageClient';
import { getMe, type AdminSession } from '@/lib/api/auth';
import { today } from '@/lib/dates';
import { getOrderCounts, getOrdersFiltered } from '@/lib/api/orders';
import { getTenantAvailability } from '@/lib/api/tenants';

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookie = (await cookies()).toString();
  const { nuevo } = await searchParams;

  let session: AdminSession;
  try {
    session = await getMe(cookie);
  } catch {
    redirect('/admin/login');
  }

  const date = today();
  const [orders, counts, tenant] = await Promise.all([
    getOrdersFiltered(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
    getOrderCounts(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
    getTenantAvailability(session.tenantSlug),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <PedidosPageClient
        initialOrders={orders.data}
        initialCounts={counts}
        tenantSlug={session.tenantSlug}
        tenant={tenant}
        autoCreate={nuevo === '1'}
      />
    </div>
  );
}
