import { getTenantAvailability } from '@/lib/api/tenants';
import { CarritoContent } from './CarritoContent';

export default async function CarritoPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantAvailability(slug);
  return <CarritoContent slug={slug} tenant={tenant} />;
}
