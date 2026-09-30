# Frontend Audit Snapshot — Sistema de Pedidos Online

> **Snapshot del 2026-09-14, puede estar desactualizado. Fuente de verdad vigente: documentation/FRONTEND.md**

Reporte de reconocimiento del frontend (Next.js) para auditoría externa.
Fecha: 2026-09-14. No se modificó ningún archivo fuente.

> Raíz real del proyecto: `frontend_pedidos/`.

---

## 1. Estructura de carpetas (3 niveles, excluyendo `node_modules/` y `.next/`)

```
frontend_pedidos/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── icon.png
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── login/
│   │       │   └── page.tsx
│   │       └── (protected)/
│   │           ├── layout.tsx
│   │           ├── configuracion/
│   │           │   ├── page.tsx
│   │           │   ├── config-manager.tsx
│   │           │   ├── exceptions-section.tsx
│   │           │   ├── menu-link-section.tsx
│   │           │   └── schedule-section.tsx
│   │           ├── dashboard/
│   │           │   └── page.tsx
│   │           ├── menu/
│   │           │   ├── page.tsx
│   │           │   └── menu-manager.tsx
│   │           └── pedidos/
│   │               └── page.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── [tenant]/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── carrito/
│   │       │   ├── page.tsx
│   │       │   └── CarritoContent.tsx
│   │       ├── checkout/
│   │       │   ├── page.tsx
│   │       │   └── CheckoutContent.tsx
│   │       ├── info/
│   │       │   ├── page.tsx
│   │       │   └── InfoNegocioContent.tsx
│   │       ├── menu/
│   │       │   └── page.tsx
│   │       └── pedido/
│   │           └── [uuid]/
│   │               ├── page.tsx
│   │               └── PedidoContent.tsx
│   ├── register/
│   │   └── page.tsx
│   └── registro/
│       └── page.tsx
├── components/
│   ├── admin/
│   │   ├── AdminNav.tsx
│   │   ├── AdminSessionProvider.tsx
│   │   ├── CategoryFormModal.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── incomplete-config-banner.tsx
│   │   ├── OrderCard.tsx
│   │   ├── PedidosFiltersBar.tsx
│   │   ├── PedidosGrid.tsx
│   │   ├── PedidosPageClient.tsx
│   │   ├── ProductFormModal.tsx
│   │   ├── RecentOrdersTable.tsx
│   │   ├── register-form.tsx
│   │   ├── StoreStatusToggle.tsx
│   │   └── Toast.tsx
│   ├── public/
│   │   ├── AddToCartButton.tsx
│   │   ├── CartBadge.tsx
│   │   ├── CategoryNav.tsx
│   │   └── InfoNegocioModal.tsx
│   └── ui/
│       └── StatusBadge.tsx
├── hooks/
│   └── usePedidosFilters.ts
├── lib/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── categories.ts
│   │   ├── client.ts
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   └── tenants.ts
│   ├── context/
│   │   └── CartContext.tsx
│   ├── utils/
│   │   └── schedule.ts
│   ├── dates.ts
│   └── order-actions.ts
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── logo.webp
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── next.config.ts
├── package.json
├── tsconfig.json
├── next-env.d.ts
└── .env
```

Notas:
- No existe `context/` en la raíz; el contexto del carrito está en `lib/context/CartContext.tsx`.
- El API client está en `lib/api/client.ts`.

---

## 2. Archivos de configuración y núcleo

### path: frontend_pedidos/next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;
```

### path: frontend_pedidos/app/globals.css

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --color-primary: #ea580c;
  --color-secondary: #1e293b;
  --color-primary-foreground: #ffffff;
  --color-muted: #6c757d;
  --color-status-open: #2D6A4F;
  --color-status-closed: #6C757D;
  --color-order-new: #F9AC19;
  --color-order-preparing: #457B9D;
  --color-order-ready: #2D6A4F;
  --color-order-delivered: #ADB5BD;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-primary-foreground: var(--color-primary-foreground);
  --color-muted: var(--color-muted);
  --color-status-open: var(--color-status-open);
  --color-status-closed: var(--color-status-closed);
  --color-order-new: var(--color-order-new);
  --color-order-preparing: var(--color-order-preparing);
  --color-order-ready: var(--color-order-ready);
  --color-order-delivered: var(--color-order-delivered);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

body {
  background: var(--background);
  color: var(--foreground);
  overflow-x: hidden;
}
```

### path: frontend_pedidos/app/(public)/[tenant]/layout.tsx

```tsx
import { getTenantAvailability } from '@/lib/api/tenants';

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
    <div style={themeStyle} data-tenant={slug}>
      {children}
    </div>
  );
}
```

### path: frontend_pedidos/app/(admin)/admin/(protected)/layout.tsx

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminSessionProvider } from '@/components/admin/AdminSessionProvider';
import { getMe } from '@/lib/api/auth';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  let session;
  try {
    session = await getMe(cookieStore.toString());
  } catch {
    redirect('/admin/login');
  }

  return (
    <AdminSessionProvider session={session}>
      <AdminNav />
      <div className="pb-16 md:pb-0">{children}</div>
    </AdminSessionProvider>
  );
}
```

### path: frontend_pedidos/lib/context/CartContext.tsx

```tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextValue['addItem'] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const updateQuantity = (productId: string, quantity: number) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
```

### path: frontend_pedidos/lib/api/client.ts

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message ?? `Error ${res.status}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json();
}
```

---

## 3. Páginas públicas representativas

### path: frontend_pedidos/app/(public)/[tenant]/page.tsx — Menú Digital (página principal del tenant)

```tsx
import { getTenantAvailability } from '@/lib/api/tenants';
import { getCategories } from '@/lib/api/categories';
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
      <main className={`w-full ${tenant.secondaryColor ? 'bg-[var(--color-secondary)]/10' : 'bg-gray-50'}`}>
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
            <a
              href={`/${slug}/info`}
              className="block -mt-8 mb-8 text-white/70 hover:text-white text-sm font-medium transition-colors underline underline-offset-4"
            >
              Ver info del negocio
            </a>
            <a
              className="group relative inline-flex items-center justify-center px-10 py-4 font-semibold text-lg text-white bg-[var(--color-primary)] rounded-xl overflow-hidden shadow-lg transition-all duration-300 active:scale-95"
              href={`/${slug}/menu`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Ver Menú
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </span>
            </a>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-8" id="menu">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="grid grid-cols-2 gap-4 md:col-span-3">
              {categoriesRes.data.map((category) => (
                <a
                  key={category.id}
                  href={`/${slug}/menu#section-${category.id}`}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-3 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)] transition-shadow"
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
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

> El menú detallado de productos está en `app/(public)/[tenant]/menu/page.tsx` (no incluido en este snapshot).

### path: frontend_pedidos/app/(public)/[tenant]/checkout/page.tsx

```tsx
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
```

### path: frontend_pedidos/app/(public)/[tenant]/checkout/CheckoutContent.tsx (client; llama a `createOrder`)

```tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { type TenantConfigResponseDto } from '@/lib/api/tenants';
import { createOrder, type PaymentMethod, type DeliveryType, type CreateOrderDto } from '@/lib/api/orders';

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

export function CheckoutContent({
  slug,
  tenant,
}: {
  slug: string;
  tenant: TenantConfigResponseDto;
}) {
  const router = useRouter();
  const { items, clear } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RETIRO_LOCAL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [deliveryAgreed, setDeliveryAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{name?: string; phone?: string; address?: string; deliveryAgreed?: string}>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const hasFixedDelivery = tenant.deliveryCostEnabled && tenant.deliveryCost != null;
  const deliveryCost = hasFixedDelivery ? tenant.deliveryCost! : 0;
  const total = subtotal + (deliveryType === 'ENVIO_DOMICILIO' ? deliveryCost : 0);

  if (items.length === 0) {
    return (
      <div className={`relative flex min-h-screen w-full flex-col ${tenant.secondaryColor ? 'bg-[var(--color-secondary)]/10' : 'bg-gray-50'}`}>
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
            No hay productos para confirmar
          </p>
          <a
            href={`/${slug}/menu`}
            className="inline-flex items-center justify-center rounded-lg h-11 px-6 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold transition-transform active:scale-95"
          >
            Ver menú
          </a>
        </main>
      </div>
    );
  }

  function validate(): boolean {
    const newErrors: typeof fieldErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Ingresá tu nombre';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
      newErrors.name = 'El nombre no puede contener números';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Ingresá tu teléfono';
    } else if (!/^[0-9\s+]+$/.test(phone.trim())) {
      newErrors.phone = 'Solo se permiten números, espacio y +';
    }
    if (deliveryType === 'ENVIO_DOMICILIO') {
      if (!address.trim()) {
        newErrors.address = 'Ingresá la dirección de envío';
      } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(address.trim())) {
        newErrors.address = 'La dirección debe incluir letras y números';
      }
    }
    if (deliveryType === 'ENVIO_DOMICILIO' && !hasFixedDelivery && !deliveryAgreed) newErrors.deliveryAgreed = 'Aceptá el acuerdo de envío para continuar';

    setFieldErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0];
    if (firstErrorKey) {
      const refMap = { name: nameRef, phone: phoneRef, address: addressRef };
      refMap[firstErrorKey as keyof typeof refMap]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    const dto: CreateOrderDto = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customer: { name: name.trim(), phone: phone.trim() },
      paymentMethod,
      deliveryType,
      notes: notes.trim() || undefined,
      deliveryNotes: deliveryNotes.trim() || undefined,
    };

    if (deliveryType === 'ENVIO_DOMICILIO') {
      dto.address = address.trim();
      dto.customer.address = address.trim();
    }

    setSubmitting(true);
    try {
      const res = await createOrder(slug, dto);
      clear();
      router.push(`/${slug}/pedido/${res.trackingUuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`relative flex min-h-screen w-full flex-col ${tenant.secondaryColor ? 'bg-[var(--color-secondary)]/10' : 'bg-gray-50'}`}>
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center p-4 pb-2 justify-between">
          <a
            href={`/${slug}/carrito`}
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

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-6 pb-32 max-w-7xl mx-auto w-full">
        <h1 className="text-[var(--color-foreground)] text-[24px] font-bold leading-tight tracking-[-0.015em] mb-6">
          Finalizar pedido
        </h1>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] space-y-4">
              <h2 className="text-[var(--color-foreground)] font-bold text-lg leading-tight">
                Información personal
              </h2>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">
                  Nombre completo
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[var(--color-foreground)] text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                />
                {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">
                  Teléfono de contacto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] material-symbols-outlined">
                    call
                  </span>
                  <input
                    ref={phoneRef}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={15}
                    placeholder="+54 9 11 0000-0000"
                    type="tel"
                    className="w-full h-12 rounded-xl border border-gray-200 pl-12 pr-4 text-[var(--color-foreground)] text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                  />
                </div>
                {fieldErrors.phone && <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">
                  Notas adicionales (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin cebolla, Sin salsa..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[var(--color-foreground)] text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] space-y-4">
              <h2 className="text-[var(--color-foreground)] font-bold text-lg leading-tight">
                Método de entrega
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setDeliveryType('RETIRO_LOCAL'); setDeliveryAgreed(false); }}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    deliveryType === 'RETIRO_LOCAL'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-gray-200 text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <span className="material-symbols-outlined mb-1 text-2xl">storefront</span>
                  <span className="text-sm font-bold">Retiro local</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setDeliveryType('ENVIO_DOMICILIO'); if (paymentMethod === 'TARJETA_DEBITO') setPaymentMethod('EFECTIVO'); }}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    deliveryType === 'ENVIO_DOMICILIO'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                      : 'border-gray-200 text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  <span className="material-symbols-outlined mb-1 text-2xl">local_shipping</span>
                  <span className="text-sm font-bold">Envío a domicilio</span>
                </button>
              </div>

              {deliveryType === 'ENVIO_DOMICILIO' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">
                      Dirección de entrega
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] material-symbols-outlined">
                        location_on
                      </span>
                      <input
                        ref={addressRef}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, Altura, Piso/Depto"
                        className="w-full h-12 rounded-xl border border-gray-200 pl-12 pr-4 text-[var(--color-foreground)] text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                      />
                    </div>
                    {fieldErrors.address && <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">
                      Notas de entrega (Opcional)
                    </label>
                    <input
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="Ej: Portón negro, tocar timbre fuerte"
                      className="w-full h-12 rounded-xl border border-gray-200 px-4 text-[var(--color-foreground)] text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                    />
                  </div>
                  {!hasFixedDelivery && (
                    <>
                      <label className="flex items-start gap-3 cursor-pointer pt-1">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={deliveryAgreed}
                            onChange={(e) => setDeliveryAgreed(e.target.checked)}
                            className="size-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                          />
                        </div>
                        <span className="text-sm text-[var(--color-muted)] leading-tight">
                          El precio del envío será estipulado por el repartidor al momento de la entrega del pedido
                        </span>
                      </label>
                      {fieldErrors.deliveryAgreed && <p className="text-red-600 text-xs mt-1">{fieldErrors.deliveryAgreed}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] space-y-4">
              <h2 className="text-[var(--color-foreground)] font-bold text-lg leading-tight">
                Método de pago
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {(deliveryType === 'ENVIO_DOMICILIO'
                  ? (['EFECTIVO', 'TRANSFERENCIA'] as PaymentMethod[])
                  : (['EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO'] as PaymentMethod[])
                ).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === m
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                        : 'border-gray-200 text-[var(--color-muted)] hover:border-[var(--color-primary)]'
                    }`}
                  >
                    {m === 'EFECTIVO' && <span className="material-symbols-outlined mb-1 text-2xl">payments</span>}
                    {m === 'TRANSFERENCIA' && <span className="material-symbols-outlined mb-1 text-2xl">account_balance</span>}
                    {m === 'TARJETA_DEBITO' && <span className="material-symbols-outlined mb-1 text-2xl">credit_card</span>}
                    <span className="text-xs font-bold text-center leading-tight">
                      {m === 'EFECTIVO' && 'Efectivo'}
                      {m === 'TRANSFERENCIA' && 'Transf.'}
                      {m === 'TARJETA_DEBITO' && 'Tarjeta'}
                    </span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'TRANSFERENCIA' && (tenant.cbu || tenant.alias) && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-sm">
                    <p className="font-bold text-[var(--color-foreground)]">Datos para transferencia</p>
                    {tenant.bank && <p className="text-[var(--color-muted)]"><span className="font-semibold">Banco:</span> {tenant.bank}</p>}
                    {tenant.accountHolder && <p className="text-[var(--color-muted)]"><span className="font-semibold">Titular:</span> {tenant.accountHolder}</p>}
                    {tenant.cbu && <p className="text-[var(--color-muted)]"><span className="font-semibold">CBU:</span> {tenant.cbu}</p>}
                    {tenant.alias && <p className="text-[var(--color-muted)]"><span className="font-semibold">Alias:</span> {tenant.alias}</p>}
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-0.5">info</span>
                    <p className="text-xs text-[var(--color-muted)] font-medium leading-tight">
                      Una vez acreditado el pago, el negocio confirmará tu pedido.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="bg-[var(--color-primary)]/5 p-6 border-b border-gray-100">
                <h2 className="text-[var(--color-foreground)] font-bold text-lg leading-tight">
                  Resumen del pedido
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          src={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[var(--color-muted)] text-2xl">
                          restaurant
                        </span>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[var(--color-foreground)] text-sm font-semibold truncate">
                        {item.name}
                      </p>
                      <p className="text-[var(--color-muted)] text-xs">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-[var(--color-foreground)] text-sm font-bold flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {deliveryType === 'ENVIO_DOMICILIO' && (
                    <div className="flex justify-between text-sm text-[var(--color-muted)]">
                      <span>Subtotal</span>
                      <span className="text-[var(--color-foreground)] font-medium">{formatPrice(subtotal)}</span>
                    </div>
                  )}
                  {deliveryType === 'ENVIO_DOMICILIO' && hasFixedDelivery && (
                    <div className="flex justify-between text-sm text-[var(--color-muted)]">
                      <span>Costo de envío</span>
                      <span className="text-[var(--color-foreground)] font-medium">{formatPrice(deliveryCost)}</span>
                    </div>
                  )}
                  {deliveryType === 'ENVIO_DOMICILIO' && !hasFixedDelivery && (
                    <div className="flex flex-col gap-0.5 text-sm text-[var(--color-muted)]">
                      <div className="flex justify-between">
                        <span>Costo de envío</span>
                        <span className="text-green-600 font-semibold">A coordinar</span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] leading-tight">
                        El costo de envío no está incluido y se coordina directamente con el repartidor.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-[var(--color-primary)] pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{submitting ? 'Creando pedido...' : 'Enviar pedido'}</span>
                  {!submitting && <span className="material-symbols-outlined">send</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
```

### path: frontend_pedidos/app/(public)/[tenant]/pedido/[uuid]/page.tsx — Order tracking (server wrapper)

```tsx
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
```

### path: frontend_pedidos/app/(public)/[tenant]/pedido/[uuid]/PedidoContent.tsx (cliente; SSE `EventSource` → `.../status-stream`)

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type OrderResponseDto } from '@/lib/api/orders';
import { type TenantConfigResponseDto } from '@/lib/api/tenants';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const STEPS = ['PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'] as const;
const TERMINAL_NEGATIVE = ['CANCELADO', 'NO_RETIRADO'];

const STEP_ICONS: Record<string, string> = {
  PENDIENTE: 'receipt_long',
  EN_PREPARACION: 'restaurant',
  LISTO: 'task_alt',
  ENTREGADO: 'handshake',
};

const STEP_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
};

const STATUS_INFO: Record<string, { title: string; description: string }> = {
  PENDIENTE: { title: 'Pedido recibido', description: 'Estamos procesando tu pedido.' },
  EN_PREPARACION: { title: 'Preparando tu pedido', description: 'Estamos preparando tus productos con los mejores ingredientes.' },
  LISTO: { title: 'Pedido listo', description: 'Tu pedido está listo.' },
  ENTREGADO: { title: 'Pedido entregado', description: 'Gracias por tu compra.' },
};

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

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

const DAY_NAMES: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

function formatScheduleRange(
  regular: { dayOfWeek: number; openingTime: string; closingTime: string }[],
): string {
  if (regular.length === 0) return '';
  const sorted = [...regular].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const range = `${DAY_NAMES[first.dayOfWeek]} - ${DAY_NAMES[last.dayOfWeek]}`;
  return `${range}: ${first.openingTime.slice(0, 5)} - ${first.closingTime.slice(0, 5)}`;
}

export function PedidoContent({
  slug,
  order: initialOrder,
  tenant,
}: {
  slug: string;
  order: OrderResponseDto;
  tenant: TenantConfigResponseDto;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialOrder.status);

  const isTerminalNegative = TERMINAL_NEGATIVE.includes(status);
  const isTerminal = status === 'ENTREGADO' || isTerminalNegative;
  const currentStepIndex = STEPS.indexOf(status as typeof STEPS[number]);
  const trackingCode = initialOrder.trackingUuid.slice(0, 8).toUpperCase();

  const todaySchedule = getTodaySchedule(tenant.schedule.regular);
  const scheduleLabel = todaySchedule
    ? `${todaySchedule.openingTime} - ${todaySchedule.closingTime}`
    : formatScheduleRange(tenant.schedule.regular);

  useEffect(() => {
    if (isTerminal) return;

    const url = `${API_URL}/${slug}/orders/${initialOrder.trackingUuid}/status-stream`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const newStatus = event.data;
      setStatus(newStatus);
      if (newStatus === 'ENTREGADO' || TERMINAL_NEGATIVE.includes(newStatus)) {
        es.close();
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [slug, initialOrder.trackingUuid, isTerminal]);

  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, []);

  const whatsappMessage = tenant.whatsapp
    ? `https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(
        `¡Hola! Quisiera consultar sobre mi pedido ${trackingCode} (${tenant.name}).`,
      )}`
    : null;

  const statusInfo = STATUS_INFO[status] ?? { title: 'Estado actual', description: '' };

  return (
    <div className={`relative flex min-h-screen w-full flex-col ${tenant.secondaryColor ? 'bg-[var(--color-secondary)]/10' : 'bg-gray-50'}`}>
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

      <main className="flex-1 px-4 py-6 pb-36 max-w-lg mx-auto w-full">
        {isTerminalNegative ? (
          <section className="mb-6">
            <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 text-center">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-4 block">
                {status === 'CANCELADO' ? 'cancel' : 'do_not_disturb_on'}
              </span>
              <h2 className="text-[var(--color-foreground)] text-xl font-bold mb-2">
                {status === 'CANCELADO' ? 'Pedido cancelado' : 'No retirado'}
              </h2>
              {initialOrder.cancellationReason && (
                <p className="text-[var(--color-muted)] text-sm">
                  {initialOrder.cancellationReason}
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="mb-6">
            <div className="bg-white rounded-xl p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
              <div className="flex items-center justify-between mb-8 relative">
                <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 -z-0" />
                <div
                  className="absolute top-5 left-0 h-[2px] bg-[var(--color-primary)] -z-0 transition-all"
                  style={{
                    width: currentStepIndex >= 0
                      ? `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
                      : '0%',
                  }}
                />
                {STEPS.map((step, i) => {
                  const isCompleted = i < currentStepIndex;
                  const isActive = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                          isCompleted || isActive
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-gray-100 text-[var(--color-muted)]'
                        }`}
                      >
                        {isCompleted ? (
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: '"FILL" 1' }}
                          >
                            check
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">
                            {STEP_ICONS[step]}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-[var(--color-primary)]/30" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${
                          isActive
                            ? 'text-[var(--color-primary)]'
                            : isCompleted
                              ? 'text-[var(--color-foreground)]'
                              : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-center">
                <h2 className="text-[var(--color-foreground)] text-xl font-bold mb-2">
                  {statusInfo.title}
                </h2>
                <p className="text-[var(--color-muted)] text-sm">{statusInfo.description}</p>
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-1">
              SEGUIMIENTO
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[var(--color-foreground)] font-bold text-lg">
                #{trackingCode}
              </p>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[var(--color-primary)]">
                  content_copy
                </span>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-1">
              CLIENTE
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">
                  person
                </span>
              </div>
              <p className="text-[var(--color-foreground)] font-semibold text-sm truncate">
                {initialOrder.customer.name}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 mb-4">
          <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest mb-2">
            {initialOrder.deliveryType === 'ENVIO_DOMICILIO' ? 'DIRECCIÓN DE ENTREGA' : 'RETIRO EN LOCAL'}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[var(--color-primary)]">
                location_on
              </span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] text-sm">
                {initialOrder.deliveryType === 'ENVIO_DOMICILIO'
                  ? initialOrder.delivery?.address ?? 'Dirección no especificada'
                  : `Retirás en ${tenant.address || 'el local'}`}
              </p>
              {initialOrder.delivery?.notes && (
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {initialOrder.delivery.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="mb-6">
          <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[var(--color-foreground)] font-bold text-base">
                Resumen del Pedido
              </h3>
              <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {initialOrder.items.length} {initialOrder.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {initialOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[var(--color-muted)] text-xl">
                        restaurant
                      </span>
                    </div>
                    <div>
                      <p className="text-[var(--color-foreground)] text-sm font-semibold">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatPrice(item.price)} c/u
                      </p>
                    </div>
                  </div>
                  <span className="text-[var(--color-foreground)] text-sm font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <span className="text-[var(--color-foreground)] font-bold text-base">Total</span>
              <span className="text-xl font-extrabold text-[var(--color-primary)]">
                {formatPrice(initialOrder.total)}
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="bg-white rounded-xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
            <h3 className="text-[var(--color-foreground)] font-bold text-base mb-4">
              Información del Negocio
            </h3>
            {tenant.address && (
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    location_on
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest">
                    DIRECCIÓN DEL LOCAL
                  </p>
                  <p className="text-[var(--color-foreground)] text-sm">{tenant.address}</p>
                </div>
              </div>
            )}
            {scheduleLabel && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    schedule
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] tracking-widest">
                    HORARIO DE ATENCIÓN
                  </p>
                  <p className="text-[var(--color-foreground)] text-sm">{scheduleLabel}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {showCopied && (
        <div className="fixed top-20 left-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg toast-fade">
          Seguimiento copiado correctamente
        </div>
      )}

      <style>{`
        .toast-fade {
          animation: toastFade 2s ease-in-out forwards;
        }
        @keyframes toastFade {
          0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          75% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>

      {whatsappMessage && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <a
              href={whatsappMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all hover:brightness-105"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.522-2.961-2.638-.087-.117-.708-.941-.708-1.793s.437-1.272.593-1.442c.156-.17.34-.213.453-.213.114 0 .227.001.326.005.102.005.242-.038.379.293.144.35.492 1.2.534 1.285.043.085.07.184.014.3-.057.115-.085.184-.17.284-.085.101-.178.225-.255.302-.085.085-.174.178-.075.35.099.17.442.729.948 1.18.653.58 1.203.761 1.374.846.171.085.271.071.371-.043.101-.114.425-.494.538-.664.113-.17.227-.142.384-.085.156.057 1.002.473 1.171.558.17.085.284.127.326.199.042.072.042.417-.102.822z" />
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 1.5c-4.694 0-8.5 3.806-8.5 8.5 0 1.503.39 2.973 1.134 4.269l-1.191 4.354 4.463-1.172c1.24.717 2.66 1.049 4.094 1.049 4.694 0 8.5-3.806 8.5-8.5s-3.806-8.5-8.5-8.5z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Páginas admin representativas

### path: frontend_pedidos/app/(admin)/admin/(protected)/pedidos/page.tsx — Gestión de Pedidos

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PedidosPageClient } from '@/components/admin/PedidosPageClient';
import { getMe, type AdminSession } from '@/lib/api/auth';
import { today } from '@/lib/dates';
import { getOrderCounts, getOrdersFiltered } from '@/lib/api/orders';

export default async function PedidosPage() {
  const cookie = (await cookies()).toString();

  let session: AdminSession;
  try {
    session = await getMe(cookie);
  } catch {
    redirect('/admin/login');
  }

  const date = today();
  const [orders, counts] = await Promise.all([
    getOrdersFiltered(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
    getOrderCounts(session.tenantSlug, { dateFrom: date, dateTo: date }, cookie),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Gestión de Pedidos</h2>
        <p className="text-muted">Control en tiempo real del flujo de cocina.</p>
      </section>
      <PedidosPageClient
        initialOrders={orders.data}
        initialCounts={counts}
        tenantSlug={session.tenantSlug}
      />
    </div>
  );
}
```

### path: frontend_pedidos/components/admin/PedidosPageClient.tsx (cliente; polling cada 20 s)

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { PedidosFiltersBar } from '@/components/admin/PedidosFiltersBar';
import { PedidosGrid } from '@/components/admin/PedidosGrid';
import { usePedidosFilters } from '@/hooks/usePedidosFilters';
import {
  getOrderCounts,
  getOrdersFiltered,
  type OrderResponseDto,
  type OrderStatus,
} from '@/lib/api/orders';

const POLL_INTERVAL_MS = 20000;

export function PedidosPageClient({
  initialOrders,
  initialCounts,
  tenantSlug,
}: {
  initialOrders: OrderResponseDto[];
  initialCounts: Record<OrderStatus, number>;
  tenantSlug: string;
}) {
  const filtersHook = usePedidosFilters();
  const { search, dateFrom, dateTo, status } = filtersHook;
  const [orders, setOrders] = useState(initialOrders);
  const [counts, setCounts] = useState(initialCounts);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, countsRes] = await Promise.all([
        getOrdersFiltered(tenantSlug, { search, dateFrom, dateTo, status }),
        getOrderCounts(tenantSlug, { search, dateFrom, dateTo }),
      ]);
      setOrders(ordersRes.data);
      setCounts(countsRes);
    } catch {
      // mantener datos actuales; el próximo poll reintenta
    }
  }, [tenantSlug, search, dateFrom, dateTo, status]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <PedidosFiltersBar filtersHook={filtersHook} counts={counts} />
      <PedidosGrid initialOrders={orders} tenantSlug={tenantSlug} onOrderUpdated={fetchData} />
    </>
  );
}
```

### path: frontend_pedidos/app/(admin)/admin/(protected)/configuracion/page.tsx

```tsx
import { ConfigManager } from './config-manager';

export default function ConfiguracionPage() {
  return <ConfigManager />;
}
```

### path: frontend_pedidos/app/(admin)/admin/(protected)/configuracion/config-manager.tsx (archivo principal; secciones en `schedule-section.tsx`, `exceptions-section.tsx`, `menu-link-section.tsx`)

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import {
  getTenantConfig,
  updateTenant,
  updateTenantWithFiles,
  deleteTenantLogo,
  deleteTenantBanner,
  type TenantConfigResponseDto,
  type UpdateTenantDto,
} from '@/lib/api/tenants';
import { Toast, useToast } from '@/components/admin/Toast';
import { IncompleteConfigBanner } from '@/components/admin/incomplete-config-banner';
import { ScheduleSection } from './schedule-section';
import { ExceptionsSection } from './exceptions-section';
import { MenuLinkSection } from './menu-link-section';

const inputBase =
  'w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-60 disabled:cursor-not-allowed';
const inputClass = `${inputBase} border-black/15`;
const inputMissingClass = `${inputBase} border-amber-400`;

const labelClass = 'text-sm font-semibold text-muted';

type UpdateField = <K extends keyof UpdateTenantDto>(key: K, value: UpdateTenantDto[K]) => void;

const FORM_KEYS: (keyof UpdateTenantDto)[] = [
  'name',
  'logo',
  'banner',
  'primaryColor',
  'secondaryColor',
  'description',
  'whatsapp',
  'address',
  'cbu',
  'alias',
  'accountHolder',
  'bank',
  'isOpen',
  'deliveryCostEnabled',
  'deliveryCost',
];

const BANK_FIELDS = ['cbu', 'alias', 'accountHolder', 'bank'] as const;

type SectionKey = 'general' | 'appearance' | 'banking' | 'delivery';

const SECTION_FIELDS: Record<SectionKey, (keyof UpdateTenantDto)[]> = {
  general: ['name', 'whatsapp', 'description', 'address'],
  appearance: ['logo', 'banner', 'primaryColor', 'secondaryColor'],
  banking: ['bank', 'cbu', 'alias', 'accountHolder'],
  delivery: ['deliveryCostEnabled', 'deliveryCost'],
};

const SECTIONS = [
  { id: 'general', label: 'Información General', icon: 'badge' },
  { id: 'apariencia', label: 'Apariencia', icon: 'palette' },
  { id: 'bancarios', label: 'Datos Bancarios', icon: 'account_balance' },
  { id: 'delivery', label: 'Delivery', icon: 'delivery_dining' },
  { id: 'horarios', label: 'Horarios de Atención', icon: 'schedule' },
  { id: 'excepciones', label: 'Excepciones', icon: 'event_busy' },
  { id: 'menu-link', label: 'Link del Menú', icon: 'link' },
];

type SectionProps = {
  id: string;
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
  editing: boolean;
  sectionKey: SectionKey;
  editingSection: SectionKey | null;
  onEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
};

function getMissingSections(form: Partial<UpdateTenantDto>): string[] {
  const sections: string[] = [];

  const generalMissing = !form.description || !form.whatsapp || !form.address;
  if (generalMissing) sections.push('Información General');

  const appearanceMissing = !form.logo || !form.primaryColor || !form.secondaryColor;
  if (appearanceMissing) sections.push('Apariencia');

  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  if (bankFilled.length < BANK_FIELDS.length) sections.push('Datos Bancarios');

  return sections;
}

function toForm(data: TenantConfigResponseDto): Partial<UpdateTenantDto> {
  const form: Partial<UpdateTenantDto> = {};
  for (const key of FORM_KEYS) {
    const value = (data as unknown as Record<string, unknown>)[key];
    if (value !== undefined) {
      (form as Record<string, unknown>)[key] = value;
    }
  }
  return form;
}

export function ConfigManager() {
  const { tenantSlug } = useAdminSession();
  const { toast, show } = useToast();

  const [config, setConfig] = useState<TenantConfigResponseDto | null>(null);
  const [form, setForm] = useState<Partial<UpdateTenantDto>>({});
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [logoMarkedForDeletion, setLogoMarkedForDeletion] = useState(false);
  const [bannerMarkedForDeletion, setBannerMarkedForDeletion] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getTenantConfig(tenantSlug)
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setForm(toForm(data));
      })
      .catch(() => {
        if (active) show('No se pudo cargar la configuración', 'error');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  function updateField<K extends keyof UpdateTenantDto>(key: K, value: UpdateTenantDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateImage(file: File): boolean {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('El archivo debe ser una imagen');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no puede superar 5 MB');
      return false;
    }
    return true;
  }

  function handleLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) { e.target.value = ''; return; }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) { e.target.value = ''; return; }
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleRemoveLogo() {
    if (logoFile) {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    setLogoPreview(null);
    updateField('logo', null);
    setLogoMarkedForDeletion(true);
  }

  function handleRemoveBanner() {
    if (bannerFile) {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerFile(null);
      setBannerPreview(null);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }
    setBannerPreview(null);
    updateField('banner', null);
    setBannerMarkedForDeletion(true);
  }

  async function handleSave(): Promise<boolean> {
    if (bankPartial) {
      show('Completá los 4 datos bancarios o dejalos todos vacíos.', 'error');
      return false;
    }
    setSaving(true);
    setImageError(null);
    try {
      if (logoMarkedForDeletion && !logoFile) await deleteTenantLogo(tenantSlug);
      if (bannerMarkedForDeletion && !bannerFile) await deleteTenantBanner(tenantSlug);

      let result: TenantConfigResponseDto;
      if (logoFile || bannerFile) {
        result = await updateTenantWithFiles(tenantSlug, form, { logo: logoFile, banner: bannerFile } as { logo: File | null; banner: File | null });
      } else {
        result = await updateTenant(tenantSlug, form);
      }
      setConfig(result);
      setForm(toForm(result));
      if (logoFile) { setLogoFile(null); setLogoPreview(null); }
      if (bannerFile) { setBannerFile(null); setBannerPreview(null); }
      setLogoMarkedForDeletion(false);
      setBannerMarkedForDeletion(false);
      show('Cambios guardados');
      return true;
    } catch {
      show('No se pudo guardar', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSection() {
    const ok = await handleSave();
    if (ok) setEditingSection(null);
  }

  function handleCancelSection(sectionKey: SectionKey) {
    if (!config) return;
    const original = toForm(config);
    setForm((prev) => {
      const reverted = { ...prev };
      for (const field of SECTION_FIELDS[sectionKey]) {
        (reverted as Record<string, unknown>)[field] = (original as Record<string, unknown>)[field];
      }
      return reverted;
    });
    if (sectionKey === 'appearance') {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview(null);
      setBannerPreview(null);
      setLogoMarkedForDeletion(false);
      setBannerMarkedForDeletion(false);
      setImageError(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
    setEditingSection(null);
  }

  function handleSectionClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  }

  async function handleToggleOpen(value: boolean) {
    setForm((prev) => ({ ...prev, isOpen: value }));
    try {
      await updateTenant(tenantSlug, { isOpen: value });
      show(value ? 'Local abierto' : 'Local cerrado');
    } catch {
      show('No se pudo actualizar el estado', 'error');
      setForm((prev) => ({ ...prev, isOpen: !value }));
    }
  }

  if (!config) {
    return <div className="text-muted py-12 text-center">Cargando configuración…</div>;
  }

  const missingSections = getMissingSections(form);
  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  const bankPartial = bankFilled.length > 0 && bankFilled.length < BANK_FIELDS.length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24">
      <IncompleteConfigBanner missingSections={missingSections} />
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Configuración del Negocio
        </h1>
        <p className="text-muted">
          Administra la identidad, canales de contacto y costos de tu establecimiento.
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectionClick(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-black/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          <GeneralInfo
            id="general"
            form={form}
            updateField={updateField}
            editing={editingSection === 'general'}
            sectionKey="general"
            editingSection={editingSection}
            onEdit={() => setEditingSection('general')}
            onCancel={() => handleCancelSection('general')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <Appearance
            id="apariencia"
            form={form}
            updateField={updateField}
            editing={editingSection === 'appearance'}
            sectionKey="appearance"
            editingSection={editingSection}
            onEdit={() => setEditingSection('appearance')}
            onCancel={() => handleCancelSection('appearance')}
            onConfirm={handleConfirmSection}
            saving={saving}
            logoPreview={logoPreview}
            bannerPreview={bannerPreview}
            logoInputRef={logoInputRef}
            bannerInputRef={bannerInputRef}
            onLogoFileChange={handleLogoFileChange}
            onBannerFileChange={handleBannerFileChange}
            onRemoveLogo={handleRemoveLogo}
            onRemoveBanner={handleRemoveBanner}
            imageError={imageError}
          />
          <BankingDetails
            id="bancarios"
            form={form}
            updateField={updateField}
            editing={editingSection === 'banking'}
            sectionKey="banking"
            editingSection={editingSection}
            onEdit={() => setEditingSection('banking')}
            onCancel={() => handleCancelSection('banking')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <Delivery
            id="delivery"
            form={form}
            updateField={updateField}
            editing={editingSection === 'delivery'}
            sectionKey="delivery"
            editingSection={editingSection}
            onEdit={() => setEditingSection('delivery')}
            onCancel={() => handleCancelSection('delivery')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <section id="horarios" className="scroll-mt-24">
            <ScheduleSection
              slug={tenantSlug}
              isOpen={form.isOpen ?? true}
              onToggleOpen={handleToggleOpen}
            />
          </section>
          <section id="excepciones" className="scroll-mt-24">
            <ExceptionsSection slug={tenantSlug} />
          </section>
          <section id="menu-link" className="scroll-mt-24">
            <MenuLinkSection />
          </section>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  sectionKey,
  editingSection,
  onEdit,
}: {
  icon: string;
  title: string;
  sectionKey: SectionKey;
  editingSection: SectionKey | null;
  onEdit: () => void;
}) {
  const isEditing = editingSection === sectionKey;
  return (
    <div className="flex items-center justify-between mb-5 border-b border-black/10 pb-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {!isEditing && (
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-muted hover:text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Editar
        </button>
      )}
    </div>
  );
}

function SectionActions({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-black/5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-5 py-2 rounded-lg border border-black/15 text-muted font-semibold hover:bg-black/5 transition-all disabled:opacity-40"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-40"
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}

function GeneralInfo({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="badge"
        title="Información General"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nombre del Negocio</label>
          <input
            className={inputClass}
            type="text"
            value={form.name ?? ''}
            disabled={!editing}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>WhatsApp de Pedidos</label>
          <input
            className={form.whatsapp ? inputClass : inputMissingClass}
            type="tel"
            value={form.whatsapp ?? ''}
            placeholder="5491112345678"
            disabled={!editing}
            onChange={(e) => updateField('whatsapp', e.target.value)}
          />
          <p className="text-xs text-muted">
            Sin +54 fijo. Ejemplo: <span className="font-mono">5491112345678</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Descripción Corta</label>
          <textarea
            className={`${form.description ? inputClass : inputMissingClass} min-h-[70px] resize-none`}
            rows={2}
            value={form.description ?? ''}
            disabled={!editing}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Dirección del Local</label>
          <div className="relative">
            <input
              className={`${form.address ? inputClass : inputMissingClass} pr-12`}
              type="text"
              value={form.address ?? ''}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              disabled={!editing}
              onChange={(e) => updateField('address', e.target.value)}
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver dirección en Google Maps"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">location_on</span>
            </a>
          </div>
        </div>
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function Appearance({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
  logoPreview,
  bannerPreview,
  logoInputRef,
  bannerInputRef,
  onLogoFileChange,
  onBannerFileChange,
  onRemoveLogo,
  onRemoveBanner,
  imageError,
}: SectionProps & {
  logoPreview: string | null;
  bannerPreview: string | null;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBannerFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  onRemoveBanner: () => void;
  imageError: string | null;
}) {
  const effectiveLogo = logoPreview ?? form.logo;
  const effectiveBanner = bannerPreview ?? form.banner;
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="palette"
        title="Apariencia"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Logo del Negocio</label>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoFileChange} className="hidden" />
          {effectiveLogo ? (
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-black/15">
              <img src={effectiveLogo} alt="Logo" className="w-full h-full object-cover" />
              {editing && (
                <button
                  type="button"
                  onClick={onRemoveLogo}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="Quitar logo"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => editing && logoInputRef.current?.click()}
              disabled={!editing}
              className={`w-32 h-32 rounded-2xl bg-black/5 border-2 border-dashed ${editing ? 'border-amber-400 hover:border-primary/40 hover:bg-black/10 cursor-pointer' : 'border-amber-400'} flex items-center justify-center transition-colors disabled:cursor-not-allowed`}
            >
              <span className="material-symbols-outlined text-muted text-3xl">storefront</span>
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Banner del Negocio</label>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={onBannerFileChange} className="hidden" />
          {effectiveBanner ? (
            <div className="relative w-64 h-32 rounded-2xl overflow-hidden border border-black/15">
              <img src={effectiveBanner} alt="Banner" className="w-full h-full object-cover" />
              {editing && (
                <button
                  type="button"
                  onClick={onRemoveBanner}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="Quitar banner"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => editing && bannerInputRef.current?.click()}
              disabled={!editing}
              className={`w-64 h-32 rounded-2xl bg-black/5 border-2 border-dashed ${editing ? 'border-amber-400 hover:border-primary/40 hover:bg-black/10 cursor-pointer' : 'border-amber-400'} flex flex-col items-center justify-center gap-1 text-muted transition-colors disabled:cursor-not-allowed`}
            >
              <span className="material-symbols-outlined text-2xl">image</span>
              <span className="text-xs font-medium">Subir Banner</span>
            </button>
          )}
        </div>
        <div className="flex-1 space-y-6 min-w-[280px]">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Color Primario de la Marca</label>
            <div className="flex items-center gap-3">
              <input
                className="h-12 w-12 cursor-pointer rounded-full border-2 border-white shadow-md p-0 overflow-hidden appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor ?? '') ? form.primaryColor ?? '#ea580c' : '#ea580c'}
                disabled={!editing}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
              <input
                className={`${form.primaryColor ? inputClass : inputMissingClass} font-mono`}
                type="text"
                value={form.primaryColor ?? ''}
                placeholder="#EA580C"
                disabled={!editing}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Color de Fondo</label>
            <div className="flex items-center gap-3">
              <input
                className="h-12 w-12 cursor-pointer rounded-full border-2 border-white shadow-md p-0 overflow-hidden appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(form.secondaryColor ?? '') ? form.secondaryColor ?? '#1e293b' : '#1e293b'}
                disabled={!editing}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
              <input
                className={`${form.secondaryColor ? inputClass : inputMissingClass} font-mono`}
                type="text"
                value={form.secondaryColor ?? ''}
                placeholder="#1E293B"
                disabled={!editing}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
            </div>
            <span className="text-xs font-medium text-muted">
              Este color se aplica de forma suavizada como fondo de tu página
            </span>
          </div>
        </div>
      </div>
      {imageError && <p className="text-red-600 text-xs font-medium mt-3">{imageError}</p>}
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function BankingDetails({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  const bankPartial = bankFilled.length > 0 && bankFilled.length < BANK_FIELDS.length;
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="account_balance"
        title="Datos Bancarios"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <p className="text-sm text-gray-500 mt-2 mb-5 flex items-start gap-1">
        <span className="material-symbols-outlined text-base">info</span>
        Estos datos se mostrarán al cliente cuando elija &quot;Transferencia&quot; como método de pago.
      </p>
      {editing && bankPartial && (
        <p className="text-xs text-red-600 mb-5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          Completá los 4 datos bancarios o dejalos todos vacíos.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Entidad / Banco</label>
          <input
            className={form.bank ? inputClass : inputMissingClass}
            type="text"
            value={form.bank ?? ''}
            placeholder="Ej: Banco Nación"
            disabled={!editing}
            onChange={(e) => updateField('bank', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>CBU</label>
          <input
            className={form.cbu ? inputClass : inputMissingClass}
            type="text"
            value={form.cbu ?? ''}
            placeholder="22 dígitos"
            disabled={!editing}
            onChange={(e) => updateField('cbu', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Alias</label>
          <input
            className={form.alias ? inputClass : inputMissingClass}
            type="text"
            value={form.alias ?? ''}
            placeholder="Ej: mi.negocio.pago"
            disabled={!editing}
            onChange={(e) => updateField('alias', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Titular</label>
          <input
            className={form.accountHolder ? inputClass : inputMissingClass}
            type="text"
            value={form.accountHolder ?? ''}
            placeholder="Nombre completo del titular"
            disabled={!editing}
            onChange={(e) => updateField('accountHolder', e.target.value)}
          />
        </div>
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function Delivery({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  const enabled = form.deliveryCostEnabled ?? false;
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="delivery_dining"
        title="Delivery"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="flex flex-wrap items-center justify-between gap-6 p-4 rounded-xl bg-black/5">
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              disabled={!editing}
              onChange={(e) => updateField('deliveryCostEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-disabled:opacity-60 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
          <span className="font-semibold text-foreground">Habilitar costo fijo de Delivery</span>
        </div>
        {enabled && (
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <label className={labelClass + ' whitespace-nowrap'}>Costo de Envío</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryCost === null || form.deliveryCost === undefined ? '' : form.deliveryCost}
              placeholder="$ 0.00"
              disabled={!editing}
              onChange={(e) =>
                updateField('deliveryCost', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        )}
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}
```

---

## 5. package.json — versiones de dependencias

### path: frontend_pedidos/package.json

```json
{
  "name": "frontend_pedidos_online",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```