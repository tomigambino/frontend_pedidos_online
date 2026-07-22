import { getTenantAvailability } from '@/lib/api/tenants';
import { getCategories } from '@/lib/api/categories';
import { InfoNegocioModal } from '@/components/public/InfoNegocioModal';
import { StatusBadge } from '@/components/ui/StatusBadge';

const CATEGORY_ICONS: Record<string, string> = {
  Bebidas: 'local_drink',
  Hamburguesas: 'lunch_dining',
  Pizzas: 'local_pizza',
  Postres: 'cake',
  Ensaladas: 'spa',
};

function getTodaySchedule(
  regular: { dayOfWeek: number; openingTime: string; closingTime: string }[],
) {
  const dayIndex = (new Date().getDay() + 6) % 7 + 1;
  const today = regular.find((s) => s.dayOfWeek === dayIndex);
  if (!today) return null;
  return {
    openingTime: today.openingTime.slice(0, 5),
    closingTime: today.closingTime.slice(0, 5),
  };
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;

  const [tenant, categoriesRes] = await Promise.all([
    getTenantAvailability(slug),
    getCategories(slug),
  ]);

  const todaySchedule = getTodaySchedule(tenant.schedule.regular);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <main className="w-full">
        <section className="relative h-[751px] w-full flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0 z-0">
            {tenant.banner ? (
              <img
                className="w-full h-full object-cover"
                src={tenant.banner}
                alt={tenant.name}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </div>
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-20 text-white flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-xl mb-6 flex items-center justify-center drop-shadow-md shadow-md">
              {tenant.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-[var(--color-primary)] text-5xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  store
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-2 drop-shadow-md">{tenant.name}</h1>
            {tenant.description && (
              <p className="text-lg text-white/90 mb-6 max-w-md">{tenant.description}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <StatusBadge
                isOpen={tenant.isOpen}
                scheduleLabel={
                  todaySchedule
                    ? `${todaySchedule.openingTime}–${todaySchedule.closingTime}`
                    : null
                }
              />
            </div>
            <InfoNegocioModal tenant={tenant} />
            <a
              className="group relative inline-flex items-center justify-center px-10 py-4 font-semibold text-lg text-white bg-[var(--color-primary)] rounded-xl overflow-hidden shadow-lg transition-all duration-300 active:scale-95"
              href="#menu"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ver Menú
                <span className="material-symbols-outlined transition-transform group-hover:translate-y-1">
                  keyboard_arrow_down
                </span>
              </span>
            </a>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8" id="menu">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="grid grid-cols-2 gap-4 md:col-span-3">
              {categoriesRes.data.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 cursor-pointer"
                >
                  <div className="bg-[var(--color-primary)]/10 rounded-lg p-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">
                      {CATEGORY_ICONS[category.name] ?? 'restaurant_menu'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-lg text-[var(--color-foreground)]">
                      {category.name}
                    </span>
                    <span className="text-[var(--color-muted)] text-sm">
                      {category.productCount}{' '}
                      {category.productCount === 1 ? 'opción' : 'opciones'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
