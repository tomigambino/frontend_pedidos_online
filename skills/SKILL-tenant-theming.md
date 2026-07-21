# SKILL: Tenant Theming (Next.js + CSS Variables)

## Objetivo
Cada negocio tiene sus propios colores de marca (`primary_color`, `secondary_color` en el modelo `Tenant`). El frontend debe aplicar ese theming dinámicamente sin recompilar ni tener CSS distinto por negocio.

---

## 1. Estrategia: CSS Custom Properties inyectadas en runtime

El layout de `[tenant]` obtiene los datos del negocio (incluyendo colores) y los inyecta como variables CSS inline en un contenedor raíz.

```tsx
// app/(public)/[tenant]/layout.tsx
import { getTenantAvailability } from '@/lib/api/tenants';

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  // GET /:tenant/availability — trae config pública (colores, horarios, etc.)
  const tenant = await getTenantAvailability(params.tenant);

  const themeStyle = {
    '--color-primary': tenant.primaryColor ?? undefined,
    '--color-secondary': tenant.secondaryColor ?? undefined,
  } as React.CSSProperties;

  return (
    <div style={themeStyle} data-tenant={params.tenant}>
      {children}
    </div>
  );
}
```

```typescript
// lib/api/tenants.ts
import { apiClient } from './client';

export function getTenantAvailability(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/availability`);
}
```

**Ojo:** `primaryColor` y `secondaryColor` pueden venir `null` si el negocio no configuró theming todavía (ver `TenantConfigResponseDto` en `API_REFERENCE.md`) — de ahí el `?? undefined`, para que caiga en el default de `globals.css` en vez de pisarlo con `null`.

---

## 2. Variables CSS base (definidas en globals.css)

Definir defaults por si un tenant no tiene colores configurados todavía.

```css
/* app/globals.css */
:root {
  --color-primary: #ea580c;
  --color-secondary: #1e293b;
  --color-primary-foreground: #ffffff;
}
```

---

## 3. Uso en componentes (Tailwind + arbitrary values)

```tsx
// components/ui/Button.tsx
export function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 rounded-lg"
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## 4. Qué NO hacer

```tsx
// ❌ INCORRECTO — color hardcodeado de un negocio de prueba
<button className="bg-orange-600">Confirmar</button>

// ❌ INCORRECTO — theming vía Context/Provider innecesario
// No hace falta un ThemeProvider de React: las CSS vars ya cubren esto
// sin necesidad de re-render de todo el árbol.

// ❌ INCORRECTO — leer el color en JS para aplicar inline style manualmente en cada componente
<div style={{ backgroundColor: tenant.primaryColor }}> // repetir esto en cada componente es frágil
```

---

## 5. Checklist antes de hacer commit

- [ ] ¿El layout de `[tenant]` inyecta `--color-primary` y `--color-secondary`?
- [ ] ¿`globals.css` tiene defaults por si el tenant no configuró colores?
- [ ] ¿Ningún componente usa un color de Tailwind hardcodeado (`bg-orange-600`, etc.) para elementos de marca?
- [ ] ¿Se probó con al menos 2 tenants con colores distintos para confirmar que cambia?

---

## Project Context

### Campos de theming en el modelo Tenant (de diagrams.md)

```
primary_color    string   ej: "#EA580C"
secondary_color  string   ej: "#1E293B"
logo             string   URL (Cloudinary)
banner           string   URL (Cloudinary)
```

### Dónde se resuelve el tenant

El slug viene de la URL (`tuapp.com/donpepe` → `params.tenant === 'donpepe'`). El layout llama a la API pública del backend (`GET /:tenant` o equivalente según `API_REFERENCE.md`) para traer los datos completos del negocio, incluyendo colores, logo y banner.

### Panel admin — mismo criterio

El panel admin (`(admin)/admin/...`) también puede aplicar el theming del negocio del dueño logueado (para que reconozca "su" panel), usando el mismo mecanismo pero resolviendo el tenant desde el JWT en vez del slug de URL.
