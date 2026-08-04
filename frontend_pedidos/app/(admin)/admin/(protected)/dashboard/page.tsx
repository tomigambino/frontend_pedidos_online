import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RecentOrdersTable } from '@/components/admin/RecentOrdersTable';
import { StoreStatusToggle } from '@/components/admin/StoreStatusToggle';
import { getMe, type AdminSession } from '@/lib/api/auth';
import { getOrdersAdmin, getStats, type StatsResponseDto } from '@/lib/api/orders';
import { getTenantAvailability } from '@/lib/api/tenants';

export default async function DashboardPage() {
  const cookie = (await cookies()).toString();

  let session: AdminSession;
  try {
    session = await getMe(cookie);
  } catch {
    redirect('/admin/login');
  }

  const [stats, availability, allOrders] = await Promise.all([
    getStats(session.tenantSlug, cookie),
    getTenantAvailability(session.tenantSlug),
    getOrdersAdmin(session.tenantSlug, { limit: 20 }, cookie),
  ]);

  const activeOrders = allOrders.data
    .filter((o) => !['ENTREGADO', 'CANCELADO', 'NO_RETIRADO'].includes(o.status))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Panel de Control</h2>
          <p className="text-muted">Gestiona el flujo de tus pedidos en tiempo real.</p>
        </div>
        <StoreStatusToggle initialIsOpen={availability.isOpen} tenantSlug={session.tenantSlug} />
      </section>

      <MetricsGrid stats={stats} />

      <RecentOrdersTable initialOrders={activeOrders} tenantSlug={session.tenantSlug} />
    </div>
  );
}

function MetricsGrid({ stats }: { stats: StatsResponseDto }) {
  const revenue = stats.revenueToday.toLocaleString('es-AR');
  const metrics = [
    {
      label: 'Pedidos hoy',
      value: String(stats.ordersToday),
      icon: 'shopping_basket',
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Facturación hoy',
      value: `$${revenue}`,
      icon: 'payments',
      iconClass: 'bg-secondary/10 text-secondary',
    },
    {
      label: 'Pedidos pendientes',
      value: String(stats.pendingOrders),
      icon: 'hourglass_empty',
      iconClass: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5"
        >
          <div className={`${metric.iconClass} p-4 rounded-xl`}>
            <span className="material-symbols-outlined text-2xl">{metric.icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wider text-muted">{metric.label}</p>
            <h3 className="text-4xl font-extrabold text-foreground">{metric.value}</h3>
          </div>
        </div>
      ))}
    </section>
  );
}
