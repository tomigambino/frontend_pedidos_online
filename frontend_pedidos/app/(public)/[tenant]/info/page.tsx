import { getTenantAvailability } from '@/lib/api/tenants';
import { InfoNegocioContent } from './InfoNegocioContent';

export default async function InfoPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantAvailability(slug);
  return <InfoNegocioContent slug={slug} tenant={tenant} />;
}
