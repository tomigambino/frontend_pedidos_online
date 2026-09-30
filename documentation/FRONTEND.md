# Frontend — Sistema de Pedidos Online

## 1. Stack y versiones

- **Next.js** 16.2.10 (App Router, RSC por defecto)
- **React** 19.2.4 / React DOM 19.2.4
- **TypeScript** 5.x
- **Tailwind CSS** 4.x (PostCSS plugin)
- **ESLint** 9.x (config flat)
- **Node** ≥20 (tipos en `@types/node`)

Variables de entorno usadas (`.env`):

| Variable | Valor ejemplo | Uso |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base URL del backend (API REST) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | Origen público del frontend (para link del menú en admin) |

---

## 2. Estructura de rutas

Grupos de layout (App Router):

```
app/
├── (public)/
│   ├── layout.tsx           # Carga tema CSS vars y tenant
│   └── [tenant]/
│       ├── layout.tsx       # getTenantAvailability + CSS vars dinámicas
│       ├── page.tsx         # Home del tenant (menú resumido)
│       ├── menu/page.tsx    # Menú completo
│       ├── carrito/page.tsx # Carrito (CartContext)
│       ├── checkout/page.tsx# Checkout con reglas de entrega/pago
│       ├── info/page.tsx    # Info del negocio (modal)
│       └── pedido/[uuid]/page.tsx # Seguimiento (EventSource)
├── (admin)/
│   └── admin/
│       ├── layout.tsx       # Wrapper simple
│       ├── login/page.tsx   # Login admin (cookie HttpOnly)
│       └── (protected)/
│           ├── layout.tsx   # getMe() + redirect + AdminSessionProvider
│           ├── dashboard/page.tsx
│           ├── menu/page.tsx
│           ├── pedidos/page.tsx
│           └── configuracion/page.tsx
├── register/page.tsx        # Registro de negocio (form completo)
└── registro/page.tsx        # Placeholder "Registro de negocio"
```

### Tabla ruta → funcionalidad

| Ruta | Qué hace |
|---|---|
| `/[tenant]` | Home pública del tenant (resumen menú + botón ir al menú) |
| `/[tenant]/menu` | Catálogo completo con categorías, productos, AddToCart |
| `/[tenant]/carrito` | Carrito persistido en localStorage (`cart`) |
| `/[tenant]/checkout` | Checkout: datos cliente, entrega, pago, validaciones, envío |
| `/[tenant]/info` | Modal con info del negocio (dir., horarios, WhatsApp) |
| `/[tenant]/pedido/[uuid]` | Seguimiento en tiempo real (EventSource) + stepper 4 pasos |
| `/admin/login` | Login admin → setea cookie HttpOnly, redirect a `/admin/dashboard` |
| `/admin/dashboard` | Métricas del día, pedidos activos, toggle abrir/cerrar local |
| `/admin/menu` | CRUD categorías y productos (modales) |
| `/admin/pedidos` | Lista con polling 20s, filtros, contadores por estado, acciones |
| `/admin/configuracion` | 7 secciones editables por sección (ver §9) |
| `/register` | Registro completo de negocio (email, pass, nombre, slug) |
| `/registro` | **Placeholder** — solo muestra "Registro de negocio" |

> **Duplicadas:** `/register` y `/registro` coexisten. `/register` es el formulario real de registro de negocio; `/registro` es un stub sin funcionalidad. No redirigen entre sí.

---

## 3. Auth del admin

- **Cookie HttpOnly** seteada por el backend en `/auth/login` y `/auth/register`.
- `lib/api/client.ts`: todas las llamadas usan `credentials: 'include'` para enviar la cookie automáticamente.
- `app/(admin)/admin/(protected)/layout.tsx`: Server Component que llama `getMe(cookie)` (lee cookie del request y la reenvía al backend). Si falla → `redirect('/admin/login')`.
- `AdminSessionProvider` (client) expone `AdminSession` (email, tenantSlug, tenantName) vía contexto a todo el panel admin.

---

## 4. Multi-tenant en el front

- **Slug en URL**: `app/(public)/[tenant]/` — el slug identifica al negocio.
- **Layout público** (`app/(public)/[tenant]/layout.tsx`): `getTenantAvailability(slug)` en RSC; inyecta CSS vars `--color-primary` y `--color-secondary` en `style` del contenedor raíz.
- **Tema dinámico**: componentes consumen `var(--color-primary)`, `var(--color-secondary)`, `var(--color-foreground)`, `var(--color-muted)` definidas en `globals.css` y sobrescritas por tenant.

---

## 5. Carrito

- **Contexto**: `CartContext` (`lib/context/CartContext.tsx`) — provider en `app/(public)/[tenant]/layout.tsx` (client boundary implícito).
- **Clave localStorage**: `'cart'` (hardcodeada en `STORAGE_KEY`).
- **Riesgo verificado**: la clave **no incluye el tenant** → carrito compartido entre tenants si el usuario abre varios en el mismo navegador. Ver `context/PENDING.md` (si existe) para mitigación.

---

## 6. Checkout

Archivo: `app/(public)/[tenant]/checkout/CheckoutContent.tsx`

**Reglas de entrega y pago**:

| Tipo de entrega | Métodos de pago permitidos |
|---|---|
| `RETIRO_LOCAL` | Efectivo, Transferencia, **Tarjeta de débito** |
| `ENVIO_DOMICILIO` | Efectivo, Transferencia (tarjeta **excluida**) |

**Costo de envío**:
- Fijo: si `tenant.deliveryCostEnabled && tenant.deliveryCost != null` → suma al total.
- "A coordinar": si delivery habilitado pero sin costo fijo → **checkbox obligatorio** "Aceptá el acuerdo de envío" (`deliveryAgreed`), muestra "A coordinar" en resumen, **no suma al total**.

**Validaciones**:
- Nombre: solo letras y espacios.
- Teléfono: solo dígitos, espacios y `+`.
- Dirección (solo envío): requerido, debe contener letras y números.
- Checkbox acuerdo (envío sin costo fijo): obligatorio.

**Total mostrado**: `subtotal + (deliveryType === 'ENVIO_DOMICILIO' ? deliveryCost : 0)` — el costo fijo se suma; "a coordinar" no.

> Hallazgo: el total en pantalla suma envío fijo pero **no** el "a coordinar". Ver `context/PENDING.md`.

---

## 7. Seguimiento de pedido

Archivo: `app/(public)/[tenant]/pedido/[uuid]/PedidoContent.tsx`

- **EventSource** a `/{slug}/orders/{uuid}/status-stream` (SSE).
- **Cierre automático** en estados terminales: `ENTREGADO`, `CANCELADO`, `NO_RETIRADO`.
- **Stepper** 4 pasos: `PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO` (iconos + barra de progreso).
- **Pantalla aparte** para `CANCELADO` / `NO_RETIRADO` (icono rojo, motivo de cancelación si existe).
- Botón WhatsApp con link prellenado (`tenant.whatsapp`).

---

## 8. Panel admin de pedidos

Archivos: `app/(admin)/admin/(protected)/pedidos/page.tsx` + `components/admin/PedidosPageClient.tsx`

- **Polling** cada 20 s (`POLL_INTERVAL_MS = 20000`), solo si `document.visibilityState === 'visible'`.
- **Filtros**: búsqueda por texto, rango de fechas (`dateFrom`/`dateTo`), estado (select).
- **Contadores por estado**: `getOrderCounts` devuelve `Record<OrderStatus, number>` mostrados en chips.
- **Acciones por estado** (máquina de estados del backend):
  - `PENDIENTE` → `EN_PREPARACION` / `CANCELADO`
  - `EN_PREPARACION` → `LISTO` / `CANCELADO`
  - `LISTO` → `ENTREGADO` / `NO_RETIRADO`
  - Terminales (`ENTREGADO`, `CANCELADO`, `NO_RETIRADO`) → sin acciones.

---

## 9. Configuración del negocio

Archivo: `app/(admin)/admin/(protected)/configuracion/config-manager.tsx`

**Secciones (sidebar fijo + scroll)**:

| Sección | ID | Campos clave |
|---|---|---|
| Información General | `general` | name, whatsapp, description, address |
| Apariencia | `apariencia` | logo, banner, primaryColor, secondaryColor |
| Datos Bancarios | `bancarios` | bank, cbu, alias, accountHolder |
| Delivery | `delivery` | deliveryCostEnabled, deliveryCost |
| Horarios de Atención | `horarios` | CRUD franjas por día (ScheduleSection) |
| Excepciones | `excepciones` | Fechas puntuales abierto/cerrado (ExceptionsSection) |
| Link del Menú | `menu-link` | URL pública copiable (MenuLinkSection) |

**Edición por sección**: botón "Editar" → formulario inline → "Guardar cambios" / "Cancelar" (revierte solo esa sección).

**Subida/borrado logo y banner**: `updateTenantWithFiles` (multipart) + `deleteTenantLogo/Banner`. Previews `blob:` locales antes de guardar.

**Validación bancaria todo-o-nada**: si se completa **alguno** de los 4 campos (banco, CBU, alias, titular) → **obligatorios los 4**. Muestra error inline y bloquea guardado.

---

## 10. Convenciones

- **Día ISO → 1..7 (Lun=1)**: `(getDay() + 6) % 7 + 1` (`lib/utils/schedule.ts:26`, `PedidoContent.tsx:40`).
- **Formato precios**: `es-AR` → `price.toLocaleString('es-AR')` con prefijo `$` (`formatPrice` en Checkout y PedidoContent).
- **Imágenes remotas**: solo `res.cloudinary.com` (configurado en `next.config.ts` `images.remotePatterns`).
- **Íconos**: **Material Symbols** (fuente Google Fonts, clase `material-symbols-outlined`).
- **Estilos**: Tailwind 4 (CSS-first), variables CSS para tema, utilidades `bg-[var(--color-primary)]`, etc.

---

## 11. Pendiente

- **Registrar pedido manual**: no existe en el frontend (ver `documentation/ROADMAP.md`). El admin no puede crear pedidos desde el panel; solo el flujo público `/checkout` genera pedidos.