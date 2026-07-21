# AGENTS.md — Sistema de Pedidos Online (Frontend Next.js)
> **Fuente de verdad de negocio:** `documentation/API_REFERENCE.md` (contrato de endpoints del backend)
> **Raíz de trabajo:** `frontend_pedidos_online/` — OpenCode debe abrirse siempre desde acá.

---

## LECTURA OBLIGATORIA ANTES DE CUALQUIER TAREA

1. Este archivo (`AGENTS.md`) — roles, protocolo y restricciones.
2. `documentation/API_REFERENCE.md` — endpoints, DTOs y formas de respuesta reales del backend.
3. `diagrams.md` (si aplica a la pantalla) — máquina de estados, modelo de datos.
4. Las Skills de `/skills/` que apliquen a la tarea.

**Si no leíste estos puntos, no estás habilitado para generar el Plan de Acción.**

---

## 1. Definición de Roles

### Agente Arquitecto
- **Cuándo se activa:** Al crear una ruta nueva, un route group, o reorganizar `app/`.
- **Responsabilidades:**
  - Validar que la estructura respete `app/(public)/[tenant]/...` y `app/(admin)/admin/...`.
  - Decidir qué es Server Component y qué es Client Component (`"use client"` solo si hay estado, eventos o hooks de browser).
  - Aprobar el listado de archivos del Plan de Acción antes de que otro agente escriba.
- **Checklist de validación:**
  - [ ] ¿La ruta nueva está en el route group correcto (`(public)` vs `(admin)`)?
  - [ ] ¿Hay `"use client"` solo donde es estrictamente necesario?
  - [ ] ¿No se duplica lógica de fetch entre páginas?

---

### Agente de Dominio
- **Cuándo se activa:** Al escribir páginas, componentes y lógica de consumo de API.
- **Responsabilidades:**
  - Implementar **exclusivamente** las pantallas y flujos que existen en el prototipo/diseño aprobado. Nada de inventar campos o vistas fuera de lo documentado en `API_REFERENCE.md`.
  - Todo fetch al backend usa la capa definida en skill `api-consumption` (nunca `fetch` suelto dentro de un componente sin pasar por ahí).
  - El theming de cada negocio se aplica **solo** vía CSS variables definidas en skill `tenant-theming`. Nunca hardcodear colores de un negocio puntual en un componente.
  - Componentes reutilizables van a `components/ui/` (Button, Card, Input, etc.); componentes de una sola pantalla quedan junto a esa pantalla.
- **Checklist de validación:**
  - [ ] ¿Los datos que se muestran corresponden 1:1 a la forma de respuesta de `API_REFERENCE.md`?
  - [ ] ¿El JWT se guarda y envía según lo definido en `api-consumption` (nunca en `localStorage` plano sin justificar)?
  - [ ] ¿Los estados de pedido usados en UI coinciden exactamente con el enum del backend (`PENDIENTE`, `EN_PREPARACION`, etc.)?
  - [ ] ¿Ningún componente reinventa un botón/card que ya existe en `components/ui/`?

---

### Agente QA
- **Cuándo se activa:** Después de cada iteración de escritura de código.
- **Responsabilidades:**
  - Verificar que el proyecto compile (`next build` o al menos que no haya errores de tipos evidentes).
  - Revisar que no se rompió el theming de otras pantallas.
  - Chequear estados de carga, error y vacío en cada pantalla que consuma datos.
- **Checklist de validación:**
  - [ ] ¿Toda pantalla que hace fetch maneja loading / error / empty state?
  - [ ] ¿El SSE de seguimiento de pedido cierra la conexión en estado terminal (igual que el backend)?
  - [ ] ¿Mobile-first? ¿Se probó el layout en viewport angosto primero?
  - [ ] ¿No quedaron colores o textos hardcodeados de un negocio de prueba?

---

## 2. Protocolo de Plan de Acción (Obligatorio)

**Ningún agente puede escribir código sin presentar primero un Plan de Acción aprobado por el usuario.**

### Formato del Plan de Acción

```
## Plan de Acción — [Pantalla / Feature]

**Agente activo:** [Arquitecto | Dominio | QA]
**Pantalla/flujo de referencia:** [nombre del prototipo Stitch o CU]
**Skills que se aplicarán:** [lista de skills relevantes]
**Endpoints de API_REFERENCE.md consultados:** [lista]

### Archivos a crear:
- `ruta/exacta/del/archivo.tsx` — descripción de qué hace

### Archivos a modificar:
- `ruta/exacta/del/archivo.tsx` — qué se modifica y por qué

### Boceto de estructura:
[Pseudocódigo o estructura de componentes, sin implementación completa]

### Restricciones aplicadas:
[Qué reglas de theming, fetch o UI condicionan este plan]
```

> **Límite duro: máximo 2 archivos por iteración.** Si la tarea requiere más, dividirla en iteraciones separadas y esperar aprobación en cada una.

### Ciclo de trabajo

```
[Petición] → [Plan de Acción] → [Aprobación: "Proceder"] → [Escritura de código] → [QA]
                                        ↑
                             Si el plan no es claro,
                             el usuario pide ajustes
                             antes de aprobar.
```

### Regla de recuperación ante corte de texto

Si el modelo corta la respuesta antes de terminar un archivo:
1. No reescribir desde cero.
2. Escribir en el chat: `"CONTINUACIÓN — [nombre del archivo]"` y retomar desde la última línea completa.
3. El usuario confirma con `"Continuar"` antes de que el agente retome.

---

## 3. Reglas Críticas (Referencia Rápida)

### Estructura de rutas
- Panel público: `app/(public)/[tenant]/...`
- Panel admin: `app/(admin)/admin/...`
- Registro de negocio: `app/registro/...` (fuera de `[tenant]`, el negocio todavía no existe)

### Theming
- Cada negocio define sus colores vía CSS variables inyectadas en `[tenant]/layout.tsx`.
- Ningún componente usa colores hardcodeados — siempre `var(--color-primary)`, etc.
- Ver skill `tenant-theming` para el detalle completo.

### Consumo de API
- Toda llamada al backend pasa por la capa cliente definida en skill `api-consumption`.
- El `tenant_id` **nunca** se envía manualmente desde el frontend — el backend lo resuelve por slug (público) o por JWT (admin).
- Los estados de pedido en UI son un espejo exacto del enum `OrderStatus` del backend. No inventar estados intermedios ni renombrarlos en la UI sin mapeo explícito.

### Componentes
- `components/ui/` → reutilizables, sin lógica de negocio (Button, Card, Input, Modal, Badge).
- `components/<feature>/` → componentes específicos de una pantalla o flujo (ej. `components/checkout/ResumenPedido.tsx`).
- Server Component por default. `"use client"` solo si hay `useState`, `useEffect`, event handlers o hooks de browser.

### SSE — Seguimiento de pedido
- Se consume desde `pedido/[uuid]/page.tsx` (o un hook dedicado).
- La conexión se cierra en el cliente cuando el estado recibido es terminal (`ENTREGADO`, `CANCELADO`, `NO_RETIRADO`), igual que hace el backend.

---

## 4. Skills Disponibles

| Skill | Ruta | Cuándo usarla |
|---|---|---|
| `tenant-theming` | `/skills/tenant-theming/` | Layout de `[tenant]`, cualquier componente con color de marca |
| `api-consumption` | `/skills/api-consumption/` | Cualquier pantalla que lea o escriba datos del backend |
| `component-structure` | `/skills/component-structure/` | Al decidir dónde va un componente nuevo y si es server/client |

---

## 5. Pantallas del MVP y Estado

| Pantalla | Ruta | Estado |
|---|---|---|
| Landing negocio (menú) | `(public)/[tenant]/page.tsx` | ⬜ Pendiente |
| Carrito | `(public)/[tenant]/carrito/` | ⬜ Pendiente |
| Checkout | `(public)/[tenant]/checkout/` | ⬜ Pendiente |
| Seguimiento de pedido (SSE) | `(public)/[tenant]/pedido/[uuid]/` | ⬜ Pendiente |
| Login admin | `(admin)/admin/login/` | ⬜ Pendiente |
| Dashboard admin | `(admin)/admin/dashboard/` | ⬜ Pendiente |
| Pedidos admin | `(admin)/admin/pedidos/` | ⬜ Pendiente |
| Productos admin | `(admin)/admin/productos/` | ⬜ Pendiente |
| Categorías admin | `(admin)/admin/categorias/` | ⬜ Pendiente |
| Configuración negocio | `(admin)/admin/configuracion/` | ⬜ Pendiente |
| Registro (wizard 4 pasos) | `registro/` | ⬜ Pendiente |

> Actualizar el estado a `🔄 En progreso` o `✅ Listo` a medida que se avanza.

---

*AGENTS.md — v1.0 | Proyecto: Frontend pedidos online | Stack: Next.js (App Router) + TypeScript*
