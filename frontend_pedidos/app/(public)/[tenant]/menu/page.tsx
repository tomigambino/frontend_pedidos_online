import { getTenantAvailability } from '@/lib/api/tenants';
import { getCategories } from '@/lib/api/categories';
import { getProducts } from '@/lib/api/products';
import { InfoNegocioModal } from '@/components/public/InfoNegocioModal';
import { CategoryNav } from '@/components/public/CategoryNav';
import { AddToCartButton } from '@/components/public/AddToCartButton';
import { CartBadge } from '@/components/public/CartBadge';

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

function ProductCard({
  product,
}: {
  product: { id: string; name: string; description: string; price: number; imageUrl: string | null };
}) {
  return (
    <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex flex-[2_2_0px] flex-col justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[var(--color-primary)] font-bold text-lg">
            {formatPrice(product.price)}
          </p>
          <p className="text-[var(--color-foreground)] text-base font-bold leading-tight">
            {product.name}
          </p>
          {product.description && (
            <p className="text-[var(--color-muted)] text-sm font-normal leading-normal">
              {product.description}
            </p>
          )}
        </div>
        <AddToCartButton
          productId={product.id}
          name={product.name}
          price={product.price}
          imageUrl={product.imageUrl}
        />
      </div>
      <div className="w-32 h-32 shrink-0 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            className="w-full h-full object-cover"
            src={product.imageUrl}
            alt={product.name}
          />
        ) : (
          <span className="material-symbols-outlined text-[var(--color-muted)] text-3xl">
            restaurant
          </span>
        )}
      </div>
    </div>
  );
}

export default async function MenuDigitalPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;

  const [tenant, categoriesRes, productsRes] = await Promise.all([
    getTenantAvailability(slug),
    getCategories(slug),
    getProducts(slug),
  ]);

  const productsByCategory = new Map<string, typeof productsRes.data>();
  for (const product of productsRes.data) {
    const existing = productsByCategory.get(product.categoryId) ?? [];
    existing.push(product);
    productsByCategory.set(product.categoryId, existing);
  }

  const allCategories = categoriesRes.data;

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center p-4 pb-2 justify-between">
            <a
              href={`/${slug}`}
              className="flex size-12 shrink-0 items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[var(--color-foreground)]">
                arrow_back
              </span>
            </a>
            <h2 className="text-[var(--color-foreground)] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              {tenant.name}
            </h2>
            <div className="flex w-12 items-center justify-end">
              <InfoNegocioModal
                tenant={tenant}
                trigger={
                  <span className="material-symbols-outlined text-[var(--color-foreground)]">
                    info
                  </span>
                }
              />
            </div>
          </div>
          <CategoryNav categories={allCategories} />
        </div>

        <main className="flex-1 pb-28">
          {allCategories.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-[var(--color-muted)] italic">
              No hay productos disponibles por ahora.
            </div>
          ) : (
            allCategories.map((category) => {
              const products = productsByCategory.get(category.id) ?? [];
              return (
                <section
                  key={category.id}
                  id={`section-${category.id}`}
                  className="scroll-mt-32"
                >
                  <h2 className="text-[var(--color-foreground)] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                    {category.name}
                  </h2>
                  {products.length > 0 ? (
                    <div className="flex flex-col gap-4 px-4 pb-4">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-[var(--color-muted)] italic px-4 pb-4">
                      No hay productos disponibles en este momento.
                    </div>
                  )}
                </section>
              );
            })
          )}
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="flex gap-2 border-t border-gray-100 bg-white px-4 pb-6 pt-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <a
            href={`/${slug}/menu`}
            className="flex flex-1 flex-col items-center justify-end gap-1 text-[var(--color-primary)]"
          >
            <div className="flex h-8 items-center justify-center">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                restaurant_menu
              </span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">
              Menú
            </p>
          </a>
          <a
            href={`/${slug}/carrito`}
            className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-500 hover:text-[var(--color-primary)] transition-colors"
          >
            <div className="relative flex h-8 items-center justify-center">
              <CartBadge />
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">
              Carrito
            </p>
          </a>
        </div>
      </div>
    </>
  );
}
