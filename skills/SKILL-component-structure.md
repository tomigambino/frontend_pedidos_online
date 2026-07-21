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

El carrito es estado del cliente (persiste mientras navega el sitio público). Usar un store simple (Zustand o Context, a definir según lo que ya tenga el proyecto) — nunca prop-drilling manual entre `[tenant]/page.tsx` → `carrito/page.tsx`.

```tsx
// lib/store/cart.ts
'use client';
import { create } from 'zustand';

interface CartState {
  items: CartItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (productId) => set((state) => ({ /* ... */ })),
  removeItem: (productId) => set((state) => ({ /* ... */ })),
  clear: () => set({ items: [] }),
}));
```

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
