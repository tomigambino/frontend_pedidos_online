# SKILL: API Consumption (Next.js + Backend NestJS)

## Objetivo
Centralizar toda comunicación con el backend en una capa única, evitando `fetch` suelto repetido en componentes y garantizando manejo consistente de JWT, errores y tenant.

---

## 1. Cliente base

```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message ?? `Error ${res.status}`);
  }

  return res.json();
}
```

---

## 2. Un módulo por dominio (mirroring de los módulos del backend)

```typescript
// lib/api/tenants.ts
import { apiClient } from './client';

export function getTenantBySlug(slug: string) {
  return apiClient<Tenant>(`/${slug}`);
}

// lib/api/orders.ts
import { apiClient } from './client';

export function createOrder(slug: string, dto: CreateOrderDto) {
  return apiClient<Order>(`/${slug}/orders`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateOrderStatus(id: string, dto: UpdateOrderStatusDto, token: string) {
  return apiClient<Order>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  }, token);
}
```

**Regla:** un archivo en `lib/api/` por módulo del backend (`tenants.ts`, `products.ts`, `orders.ts`, `auth.ts`, etc.), nombrado igual que el módulo de NestJS para que sea fácil ubicar qué llama a qué.

---

## 3. Manejo del JWT

- El JWT se recibe en el login y se guarda en una cookie **httpOnly** seteada por un route handler propio del frontend, no en `localStorage`.
- Motivo: `localStorage` es accesible por JS (riesgo XSS); cookie httpOnly no.

```typescript
// app/(admin)/admin/login/actions.ts (Server Action)
'use server';
import { cookies } from 'next/headers';
import { login } from '@/lib/api/auth';

export async function loginAction(slug: string, email: string, password: string) {
  const { token } = await login(slug, email, password);
  cookies().set('token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
}
```

- Las páginas del admin (Server Components) leen el token de la cookie server-side y lo pasan a `apiClient`.
- Si en algún caso se necesita fetch desde un Client Component (ej. polling), exponer un route handler propio (`app/api/...`) que internamente agregue el token — nunca exponer el JWT al JS del cliente.

---

## 4. SSE (seguimiento de pedido)

```typescript
// hooks/useOrderTracking.ts
'use client';
import { useEffect, useState } from 'react';

const TERMINAL_STATES = ['ENTREGADO', 'CANCELADO', 'NO_RETIRADO'];

export function useOrderTracking(tenantSlug: string, uuid: string) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // OJO: el backend emite el estado como STRING PLANO, no JSON.
    // event.data === "EN_PREPARACION", no { estado: "..." }
    const source = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/${tenantSlug}/orders/${uuid}/status-stream`,
    );

    source.onmessage = (event) => {
      const newStatus = event.data;
      setStatus(newStatus);
      if (TERMINAL_STATES.includes(newStatus)) {
        source.close();
      }
    };

    return () => source.close();
  }, [tenantSlug, uuid]);

  return status;
}
```

---

## 5. Qué NO hacer

```tsx
// ❌ INCORRECTO — fetch suelto dentro de un componente, sin pasar por lib/api/
useEffect(() => {
  fetch('http://localhost:3001/donpepe/products').then(...)
}, []);

// ❌ INCORRECTO — guardar el JWT en localStorage
localStorage.setItem('token', token);

// ❌ INCORRECTO — enviar tenant_id manualmente en el body de una request
apiClient('/orders', { method: 'POST', body: JSON.stringify({ tenantId: '123', ...dto }) });
// El tenant_id lo resuelve el backend por slug o JWT, nunca se manda a mano.
```

---

## 6. Checklist antes de hacer commit

- [ ] ¿Todo fetch pasa por `lib/api/<modulo>.ts`, nunca directo en un componente?
- [ ] ¿El JWT vive en cookie httpOnly, no en `localStorage` ni en estado de React?
- [ ] ¿Ningún DTO enviado desde el frontend incluye `tenantId`?
- [ ] ¿El hook de SSE cierra la conexión en estado terminal?
- [ ] ¿Se manejan los 3 estados de UI (loading / error / data) en cada pantalla que hace fetch?

---

## Project Context

### Variables de entorno

```
NEXT_PUBLIC_API_URL=http://localhost:3001   # dev
```

### Correspondencia módulos backend ↔ archivos frontend

| Módulo backend | Archivo lib/api/ | Endpoint base |
|---|---|---|
| `auth` | `lib/api/auth.ts` | `POST /auth/register`, `POST /:tenant/auth/login` |
| `tenants` | `lib/api/tenants.ts` | `GET /:tenant/availability`, `PATCH /:tenant/admin/tenants` |
| `categories` | `lib/api/categories.ts` | `GET/POST/PATCH/DELETE /:tenant/categories` |
| `products` | `lib/api/products.ts` | `GET/POST/PATCH/DELETE /:tenant/products` |
| `orders` | `lib/api/orders.ts` | `GET/POST/PATCH /:tenant/orders` |

### Nota sobre nombres de campos

Los DTOs de respuesta usan **camelCase en inglés** (no español como en la doc de negocio del backend). El campo de estado del pedido es **`status`**, no `estado`:

```json
{ "status": "PENDIENTE", "trackingUuid": "uuid", ... }
```

No confundir con `AGENTS.md`/skills del backend, que usan nombres en español a nivel de negocio — el contrato real de API es el de `API_REFERENCE.md`.

### Nota sobre polling admin (20s)

El dashboard/pedidos admin usa polling cada 20s (no SSE — eso es solo para el tracking público del cliente). Implementar con `setInterval` dentro de un Client Component o con una librería liviana si el proyecto ya la tiene; no agregar dependencias nuevas sin aprobación.
