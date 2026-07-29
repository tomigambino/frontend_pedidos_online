'use client';

import { useCart } from '@/lib/context/CartContext';
import { type TenantConfigResponseDto } from '@/lib/api/tenants';
import Link from 'next/link';

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function CarritoContent({
  slug,
  tenant,
}: {
  slug: string;
  tenant: TenantConfigResponseDto;
}) {
  const { items, updateQuantity, removeItem } = useCart();

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = tenant.deliveryCostEnabled ? Number(tenant.deliveryCost ?? 0) : 0;
  const total = tenant.deliveryCostEnabled ? subtotal + delivery : subtotal;

  if (items.length === 0) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center p-4 pb-2 justify-between">
            <a
              href={`/${slug}/menu`}
              className="flex size-12 shrink-0 items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[var(--color-foreground)]">
                arrow_back
              </span>
            </a>
            <h2 className="text-[var(--color-foreground)] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              {tenant.name}
            </h2>
            <div className="flex w-12 items-center justify-end" />
          </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <span className="material-symbols-outlined text-6xl text-[var(--color-muted)]">
            shopping_cart
          </span>
          <p className="text-[var(--color-muted)] text-lg font-medium">
            Tu carrito está vacío
          </p>
          <a
            href={`/${slug}/menu`}
            className="inline-flex items-center justify-center rounded-lg h-11 px-6 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold transition-transform active:scale-95"
          >
            Ver menú
          </a>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="flex gap-2 border-t border-gray-100 bg-white px-4 pb-6 pt-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <a
              href={`/${slug}/menu`}
              className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-500 hover:text-[var(--color-primary)] transition-colors"
            >
              <div className="flex h-8 items-center justify-center">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Menú</p>
            </a>
            <a
              href={`/${slug}/carrito`}
              className="flex flex-1 flex-col items-center justify-end gap-1 text-[var(--color-primary)]"
            >
              <div className="flex h-8 items-center justify-center">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  shopping_cart
                </span>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Carrito</p>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex min-h-screen w-full flex-col bg-white">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="flex items-center p-4 pb-2 justify-between">
            <a
              href={`/${slug}/menu`}
              className="flex size-12 shrink-0 items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[var(--color-foreground)]">
                arrow_back
              </span>
            </a>
            <h2 className="text-[var(--color-foreground)] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
              {tenant.name}
            </h2>
            <div className="flex w-12 items-center justify-end" />
          </div>
        </div>

        <main className="flex-1 px-4 py-6 pb-32">
          <h1 className="text-[var(--color-foreground)] text-[24px] font-bold leading-tight tracking-[-0.015em] mb-6">
            Tu Carrito
          </h1>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex gap-4 items-center border border-gray-50"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      className="w-full h-full object-cover"
                      src={item.imageUrl}
                      alt={item.name}
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[var(--color-muted)] text-3xl">
                      restaurant
                    </span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-[var(--color-foreground)] text-base font-bold leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    {formatPrice(item.price)} × {item.quantity} ={' '}
                    <span className="text-[var(--color-foreground)] font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1">
                    <button
                      onClick={() =>
                        item.quantity === 1
                          ? removeItem(item.productId)
                          : updateQuantity(item.productId, item.quantity - 1)
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="text-base font-bold min-w-[1.5rem] text-center text-[var(--color-foreground)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-2xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[var(--color-muted)]">
                <span className="text-base">Subtotal</span>
                <span className="text-base font-bold text-[var(--color-foreground)]">
                  {formatPrice(subtotal)}
                </span>
              </div>
              {tenant.deliveryCostEnabled && (
                <div className="flex justify-between items-center text-[var(--color-muted)]">
                  <span className="text-base">Costo de envío</span>
                  <span className="text-base font-bold text-[var(--color-foreground)]">
                    {formatPrice(delivery)}
                  </span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-lg font-bold text-[var(--color-foreground)]">
                  Total General
                </span>
                <span className="text-[24px] font-extrabold text-[var(--color-primary)]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
            <button className="w-full mt-8 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-base font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all">
              Continuar
            </button>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="flex gap-2 border-t border-gray-100 bg-white px-4 pb-6 pt-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <a
              href={`/${slug}/menu`}
              className="flex flex-1 flex-col items-center justify-end gap-1 text-gray-500 hover:text-[var(--color-primary)] transition-colors"
            >
              <div className="flex h-8 items-center justify-center">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Menú</p>
            </a>
            <a
              href={`/${slug}/carrito`}
              className="flex flex-1 flex-col items-center justify-end gap-1 text-[var(--color-primary)]"
            >
              <div className="flex h-8 items-center justify-center">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  shopping_cart
                </span>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Carrito</p>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
