import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
          <h2 className="text-2xl font-bold text-foreground">Resumen de hoy</h2>
          <p className="text-muted">Gestiona el flujo de tus pedidos en tiempo real.</p>
        </div>
        <StoreStatusToggle initialIsOpen={availability.isOpen} tenantSlug={session.tenantSlug} />
      </section>

      <MetricsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrdersTable initialOrders={activeOrders} tenantSlug={session.tenantSlug} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      href: '/admin/menu',
      icon: 'add',
      label: 'Agregar producto',
      desc: 'Sumá una opción al menú',
      color: 'bg-primary/10 text-primary',
    },
    {
      href: '/admin/configuracion',
      icon: 'storefront',
      label: 'Editar mi negocio',
      desc: 'Actualizá tus datos y horarios',
      color: 'bg-secondary/10 text-secondary',
    },
  ];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-foreground mb-5">Acciones Rápidas</h3>
      <div className="flex flex-col gap-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-black/[0.02] transition-colors"
          >
            <div className={`${a.color} p-3 rounded-xl shrink-0`}>
              <span className="material-symbols-outlined text-xl">{a.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{a.label}</p>
              <p className="text-sm text-muted">{a.desc}</p>
            </div>
            <span className="material-symbols-outlined text-muted">arrow_forward</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricsGrid({ stats }: { stats: StatsResponseDto }) {
  const revenue = stats.revenueToday.toLocaleString('es-AR');
  const metrics = [
    { label: 'Pedidos hoy', value: String(stats.ordersToday), icon: 'shopping_basket' },
    { label: 'Facturación hoy', value: `$${revenue}`, icon: 'payments' },
    { label: 'Pedidos pendientes', value: String(stats.pendingOrders), icon: 'hourglass_empty' },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <span className="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted mb-2">
            {metric.label}
            <span className="material-symbols-outlined text-sm text-orange-500">{metric.icon}</span>
          </span>
          <h3 className="text-4xl font-extrabold text-foreground">
              {metric.value}
            </h3>
            {metric.label === 'Pedidos pendientes' && (
              <p className="text-sm text-muted mt-1">Requiere atención</p>
            )}
        </div>
      ))}
    </section>
  );
}
