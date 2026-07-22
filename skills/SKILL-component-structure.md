# SKILL: Component Structure (Next.js App Router)

## Objetivo
Definir dónde vive cada componente y cuándo es Server vs Client Component, para evitar duplicación y un uso innecesario de `"use client"`.

---

## 1. Ubicación de componentes

```
components/
├── ui/                 # reutilizables, sin lógica de negocio
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── Badge.tsx
│
├── checkout/            # específicos de un flujo/pantalla
│   ├── ResumenPedido.tsx
│   └── FormularioEntrega.tsx
│
├── admin/
│   ├── TablaPedidos.tsx
│   └── SelectorEstado.tsx
│
└── layout/               # header, footer, nav — compartidos entre pantallas
    ├── Header.tsx
    └── Footer.tsx
```

**Regla:** si un componente se usa en 2+ pantallas y no tiene lógica de negocio → `components/ui/`. Si es específico de una pantalla o flujo → carpeta con el nombre del feature.

---

## 2. Server Component por default

Next.js App Router asume Server Component salvo que se indique lo contrario. Usarlos siempre que sea posible: son más rápidos (sin JS al cliente) y pueden hacer `await` directo a la API.

```tsx
// app/(public)/[tenant]/page.tsx — Server Component, sin "use client"
import { getProducts } from '@/lib/api/products';

export default async function MenuPage({ params }: { params: { tenant: string } }) {
  const products = await getProducts(params.tenant);
  return <MenuList products={products} />;
}
```

---

## 3. Cuándo usar `"use client"`

Solo si el componente necesita:
- `useState`, `useReducer`, `useEffect`
- Event handlers (`onClick`, `onChange`, etc.)
- Hooks de browser (`useOrderTracking` con `EventSource`, `localStorage`, etc.)
- Librerías que dependen del DOM

```tsx
// components/checkout/BotonAgregarCarrito.tsx
'use client';
import { useCartStore } from '@/lib/store/cart';

export function BotonAgregarCarrito({ productId }: { productId: string }) {
  const addItem = useCartStore((s) => s.addItem);
  return <button onClick={() => addItem(productId)}>Agregar</button>;
}
```

**Patrón recomendado:** mantener el Client Component lo más chico posible (el botón, no toda la página) para no convertir árboles enteros en client-side sin necesidad.

---

## 4. Estado del carrito

El carrito es estado del cliente (persiste mientras navega el sitio público). Se implementa con **Context de React** (decisión del proyecto — sin dependencias externas), con persistencia manual en `localStorage` para sobrevivir refresh de página.

```tsx
// lib/context/CartContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface CartItem {
  productId: string;
  name: string;
  price: number;
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

  // Cargar desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Persistir en cada cambio
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

**Dónde montar el Provider:** en `app/(public)/layout.tsx` (layout del route group, no del `[tenant]` — así el carrito envuelve todas las pantallas públicas por igual). Es un Client Component al ser el único punto con `"use client"` de más alto nivel; el resto de páginas debajo siguen pudiendo ser Server Components.

**Nota de performance:** con Context, cualquier componente que llame `useCart()` se re-renderiza ante cualquier cambio del carrito (no hay selectors granulares). Para el tamaño de este proyecto no es un problema real — si en el futuro se vuelve necesario optimizar, ahí se evalúa migrar a una librería con selectors (Zustand u otra), pero no antes.

---

## 5. Qué NO hacer

```tsx
// ❌ INCORRECTO — "use client" en una página entera solo por un botón
'use client';
export default function MenuPage() {
  // toda la página se vuelve client-side por un solo onClick
}

// ❌ INCORRECTO — crear un componente nuevo en components/ui/ que ya existe con otro nombre
// Antes de crear, buscar si ya hay un Button/Card/Input equivalente

// ❌ INCORRECTO — lógica de negocio (cálculo de total, validación de stock) dentro de components/ui/
// components/ui/ es puramente presentacional
```

---

## 6. Checklist antes de hacer commit

- [ ] ¿El componente nuevo va en `ui/`, `<feature>/` o `layout/` según corresponda?
- [ ] ¿`"use client"` está solo en el componente más chico posible que lo necesita?
- [ ] ¿No hay lógica de negocio filtrada dentro de `components/ui/`?
- [ ] ¿El carrito usa el store centralizado, no estado local por página?
- [ ] ¿Se revisó `components/ui/` antes de crear un componente que podría ya existir?

---

## Project Context

### Mapeo pantallas → componentes esperados (según prototipo Stitch)

Al pasar cada HTML exportado de Stitch por OpenCode, el objetivo es que identifique qué partes son:
1. **Reutilizables** → van a `components/ui/` (si no existen ya)
2. **Específicas de la pantalla** → van a `components/<feature>/`
3. **Solo estructura de la página** → queda en el `page.tsx` correspondiente

Esto evita que cada pantalla piloto genere su propio botón/card con estilos ligeramente distintos.
