import { getOrderByTracking } from '@/lib/api/orders';
import { getTenantAvailability } from '@/lib/api/tenants';
import { PedidoContent } from './PedidoContent';

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ tenant: string; uuid: string }>;
}) {
  const { tenant: slug, uuid: trackingUuid } = await params;

  const [order, tenant] = await Promise.all([
    getOrderByTracking(slug, trackingUuid),
    getTenantAvailability(slug),
  ]);

  return <PedidoContent slug={slug} order={order} tenant={tenant} />;
}
