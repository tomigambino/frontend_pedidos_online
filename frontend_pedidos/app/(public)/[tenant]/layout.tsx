import { getTenantAvailability } from '@/lib/api/tenants';
import { CartProvider } from '@/lib/context/CartContext';

export default async function PublicTenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenantAvailability(slug);

  const themeStyle = {
    '--color-primary': tenant.primaryColor ?? undefined,
    '--color-secondary': tenant.secondaryColor ?? undefined,
  } as React.CSSProperties;

  return (
    <CartProvider slug={slug} key={slug}>
      <div style={themeStyle} data-tenant={slug}>
        {children}
      </div>
    </CartProvider>
  );
}
