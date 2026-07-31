import { getTenantAvailability } from '@/lib/api/tenants';
import { CheckoutContent } from './CheckoutContent';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantAvailability(slug);
  return <CheckoutContent slug={slug} tenant={tenant} />;
}
