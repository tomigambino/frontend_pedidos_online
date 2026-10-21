# Resumen de planes de acción — Horarios (Propuesta A)

> Planes copiados tal cual y resumen de lo ejecutado debajo de cada uno.
> Iteraciones ejecutadas: F1, F1b, F2a, F2b, B0, B1, F3, F4, F4b, F4c, F5, F5b, F5c y F5d.

---

## Plan de Acción — F2a: Info del negocio con todas las franjas

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** CU-04 (gestión de horarios y excepciones)
**Skills que se aplicarán:** `SKILL-component-structure`
**Archivo a modificar:** `app/(public)/[tenant]/info/InfoNegocioContent.tsx`

### Cambios:
- Reemplazar `weekSchedule.find((d) => d.isToday)` por `getEffectiveDaySchedule(regular, exceptions, getZonedDateKey())` para el label del día actual.
- Formatear el label con `formatSlot` para incluir el sufijo `(+1)`.
- Renderizar todas las franjas de cada día con `formatSlot`, no solo la primera.
- Usar como key de cada franja `${slot.openingTime}-${slot.closingTime}-${i}`.

### Resumen de lo realizado
- `InfoNegocioContent` obtiene `todaySchedule` con `getEffectiveDaySchedule` y calcula el label con `formatSlot`.
- La grilla semanal muestra todas las franjas de cada día y el sufijo `(+1)` cuando corresponde.
- Las keys pasaron de índice solo a apertura-cierre-índice.
- Sin cambios en la lógica de horarios; `formatSlot` ya estaba cubierto por la suite unitaria.

---

## Plan de Acción — F2b: Modal de info con formato compartido

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** CU-04 (gestión de horarios y excepciones)
**Skills que se aplicarán:** `SKILL-component-structure`
**Archivo a modificar:** `components/public/InfoNegocioModal.tsx`

### Cambios:
- Reemplazar la interpolación manual de apertura/cierre por `formatSlot`.
- Mantener `buildWeekSchedule` como fuente de días y franjas.
- Usar como key `${d.dayOfWeek}-${i}` y separar las franjas con `, `.

### Resumen de lo realizado
- El modal lista todas las franjas con el sufijo `(+1)` cuando corresponde.
- `hasAnyOpenDay` se mantiene sin cambios.
- Las keys usan día de la semana + índice.
- Verificado con la suite de horarios y el build del frontend.

---

## Plan de Acción — B0: `maxOrderTime` opcional en excepciones abiertas

**Agente activo:** Dominio (backend)
**Caso de uso de referencia:** CU-04 (gestión de horarios y excepciones)
**Skills que se aplicarán:** `tenant-isolation`
**Secciones consultadas:** V3 § 6.2, `horario.md` § 4.2, `plan-accion-horario.md` Iteración 3.

### Archivos a modificar:
- `backend_pedidos/src/modules/tenants/dto/create-exception.dto.ts` — dejar de exigir `maxOrderTime` cuando `isOpen=true`; validar formato solo si viene.
- `backend_pedidos/test/order-scheduled-delivery.e2e-spec.ts` — reemplazar el test que espera `400` por los casos nuevos.

### Boceto de estructura:
```ts
@IsOptional()
@IsString()
@Matches(/^\d{2}:\d{2}$/)
maxOrderTime?: string;
```

**Comportamiento esperado:**
- `POST /:tenant/admin/exceptions` con `isOpen=true`, `openingTime` y `closingTime`, sin `maxOrderTime` → `201`, `maxOrderTime: null`.
- Excepción abierta que cruza medianoche (`20:00`–`02:00`) sin `maxOrderTime` → `201`, `closesNextDay: true` y `maxOrderTime: null`.
- El default `closingTime - minimumDeliveryTime` ya se aplica al resolver el turno en `computeMaxOrderMinutes`; no hace falta tocar el service ni persistir un valor calculado.

**Tests a modificar/agregar en `order-scheduled-delivery.e2e-spec.ts`:**
1. Reemplazar `POST admin/exceptions con isOpen=true requiere maxOrderTime` por:
   - `POST admin/exceptions con isOpen=true sin maxOrderTime` → `201` y `maxOrderTime: null`.
2. Agregar:
   - `POST admin/exceptions con isOpen=true, cruce de medianoche y sin maxOrderTime` → `201`, `closesNextDay: true` y `maxOrderTime: null`.
3. Mantener los tests existentes de persistencia de `maxOrderTime` explícito y de `isOpen=false`.

### Restricciones aplicadas:
- Sin cambios de entidades ni migraciones.
- Validación de formato `HH:mm` solo cuando el campo está presente.
- No tocar solapamientos ni la lógica de `desiredDeliveryTime`.
- Límite de 2 archivos: DTO + suite e2e existente.

### Resumen de lo realizado
- `create-exception.dto.ts`: `maxOrderTime` pasó de `@ValidateIf(isOpen)` + `@IsNotEmpty()` a `@IsOptional()` + validación de formato `HH:mm` solo cuando viene.
- `order-scheduled-delivery.e2e-spec.ts`: se reemplazó el test que esperaba `400` por dos casos nuevos:
  - apertura especial sin `maxOrderTime` → `201` y `maxOrderTime: null`;
  - apertura especial con cruce de medianoche (`20:00`–`02:00`) sin `maxOrderTime` → `201`, `closesNextDay: true` y `maxOrderTime: null`.
- No fue necesario modificar el service: `createException` guarda `null` y `computeMaxOrderMinutes` aplica el fallback `closingTime - minimumDeliveryTime` al resolver el turno.
- Verificación: `npx tsc --noEmit` OK y suite e2e `order-scheduled-delivery.e2e-spec.ts` con **29 tests pasando**.

---

## Plan de Acción — B1: E2E del fallback en excepción sin `maxOrderTime`

**Agente activo:** QA (backend)
**Caso de uso de referencia:** CU-01 (Registrar pedido) / CU-04 (gestión de horarios)
**Skill que se aplicará:** `tenant-isolation`
**Archivo a modificar:** `backend_pedidos/test/schedule-midnight.e2e-spec.ts`

### Objetivo
Cubrir end-to-end el fallback `closingTime - minimumDeliveryTime` cuando la excepción abierta no tiene `maxOrderTime`, usando el cruce de medianoche.

### Caso a agregar
- Excepción abierta `2026-12-24` de `20:00` a `02:00` sin `maxOrderTime`.
- `minimumDeliveryTime = 30`.
- `now = 2026-12-24T22:00:00-03:00`.
- `desiredDeliveryTime = 2026-12-25T01:30:00-03:00` → `201`.
- `desiredDeliveryTime = 2026-12-25T01:31:00-03:00` → `400`.
- Verificar además que `seedException` sin séptimo argumento persiste `max_order_time = null`.

### Restricciones aplicadas
- Un solo archivo de test.
- Sin tocar código de producción.
- Copiar el formato de regex de mensajes usado en los tests existentes.

### Resumen de lo realizado
- Se agregó el test en `schedule-midnight.e2e-spec.ts`, dentro de `04 · resolución del turno objetivo y desired`.
- Se asserta contra la DB que `max_order_time` queda `NULL`.
- El `400` valida el mensaje con `/entre 20:00 y 01:30/`.
- Verificación: `npm ci` OK, `npx tsc --noEmit` OK y `npm run test:e2e -- schedule-midnight.e2e-spec.ts` con **30/30 tests pasando**.
- La DB de test se bajó con `npm run test:e2e:down`.

---

## Plan de Acción — F3: Admin de horarios y excepciones

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** CU-04 (gestión de horarios y excepciones)
**Skills que se aplicarán:** `SKILL-api-consumption`, `SKILL-component-structure`
**Endpoints consultados:** `GET/POST/PATCH/DELETE /:tenant/admin/schedule`; `GET/POST/DELETE /:tenant/admin/exceptions`.

### Archivos a modificar:
- `app/(admin)/admin/(protected)/configuracion/schedule-section.tsx`
  - Leyenda: *"Si el cierre es menor que la apertura, el turno termina al día siguiente."*
  - Mostrar `(cierra al día siguiente)` cuando `slot.closesNextDay` sea `true`.
  - Propagar el `message` real del backend en errores de alta/edición/borrado (solape, `opening == closing`).
  - Agregar el hint de cruce en el `ConfirmModal` de alta de franja.
- `app/(admin)/admin/(protected)/configuracion/exceptions-section.tsx`
  - Mostrar `(cierra al día siguiente)` en la lista cuando `ex.closesNextDay` sea `true`.
  - Propagar el `message` real del backend en `handleCreate` y `executeDelete`.
  - Agregar la leyenda de cruce en `ExceptionForm` cuando `isOpen` está activo.
  - **No agregar `maxOrderTime` al formulario**: B0 ya lo dejó opcional y el default lo aplica el backend. El submit actual ya no lo envía.

### Boceto:
```tsx
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// schedule-section.tsx (render de cada franja)
<span className="text-muted text-sm">a</span>
<TimeInput ... />
{slot.closesNextDay && (
  <span className="text-xs text-muted">(cierra al día siguiente)</span>
)}

// schedule-section.tsx (catch)
catch (err) {
  show(errorMessage(err, 'No se pudo actualizar el horario'), 'error');
}
```

```tsx
// exceptions-section.tsx (lista)
{ex.isOpen && ex.openingTime && ex.closingTime
  ? ` · ${ex.openingTime.slice(0, 5)} a ${ex.closingTime.slice(0, 5)}${
      ex.closesNextDay ? ' (cierra al día siguiente)' : ''
    }`
  : ''}

// ExceptionForm (debajo de apertura/cierre)
{isOpen && (
  <p className="text-xs text-muted">
    Si el cierre es menor que la apertura, el turno termina al día siguiente.
  </p>
)}
```

### Restricciones aplicadas:
- El `<input type="time">` sigue limitado a `00:00–23:59`; el cruce se logra cargando un cierre menor a la apertura.
- No se persiste ni se envía `closesNextDay`: es derivado y viene del backend.
- No se agrega `maxOrderTime` al `ExceptionForm` (B0 ya resuelve el default).
- Sin cambios de theming, layout ni estructura de cards.
- Límite de 2 archivos.
- Verificación final: `npx tsc --noEmit`, `npm run build` y `npm test`.

### Resumen de lo realizado
- `schedule-section.tsx`: leyenda de cruce, sufijo `(cierra al día siguiente)`, mensajes reales del backend en alta/edición/borrado y hint en el `ConfirmModal`.
- `exceptions-section.tsx`: sufijo `(cierra al día siguiente)` en la lista, mensajes reales del backend en alta/borrado y leyenda en `ExceptionForm` cuando `isOpen`.
- `ExceptionForm` sigue sin enviar `maxOrderTime`; B0 aplica el default.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK y `npm test` con **16/16 tests pasando**.

---

## Plan de Acción — F4: Selector de `desiredDeliveryTime` en checkout

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** CU-01 (Registrar pedido)
**Skills que se aplicarán:** `SKILL-api-consumption`, `SKILL-component-structure`
**Endpoints consultados:** `POST /:tenant/orders` (campo `desiredDeliveryTime`).

### Archivos a modificar:
- `lib/api/orders.ts` — agregar `desiredDeliveryTime?: string` a `CreateOrderDto`.
- `app/(public)/[tenant]/checkout/CheckoutContent.tsx` — calcular el turno objetivo, generar las opciones y agregar el selector.

### Boceto de estructura:
```ts
const TIME_STEP_MINUTES = 15;

function buildTimeOptions(
  target: NonNullable<ReturnType<typeof getTargetShift>>,
  minimumDeliveryTime: number,
  now: Date,
): Date[] {
  const stepMs = TIME_STEP_MINUTES * 60_000;
  const minMs = now.getTime() + minimumDeliveryTime * 60_000;
  const startMs =
    Math.ceil(Math.max(target.startDate.getTime(), minMs) / stepMs) * stepMs;

  const options: Date[] = [];
  for (let time = startMs; time <= target.maxOrderDate.getTime(); time += stepMs) {
    options.push(new Date(time));
  }
  return options;
}
```

En `CheckoutContent`:
- `now` se setea post-mount con `useEffect` (evita mismatch de hidratación; mismo patrón que `CartContext`).
- `target = getTargetShift(regular, exceptions, tenant.minimumDeliveryTime, now)`.
- `timeOptions = target ? buildTimeOptions(target, tenant.minimumDeliveryTime, now) : []`.
- Estado `selectedTime` (string ISO, vacío = “Lo antes posible”).
- Nueva card **“Horario del pedido”**:
  - Si hay `target` y `timeOptions.length > 0`: `<select>` con opción vacía “Lo antes posible” + opciones `HH:mm` formateadas en TZ AR.
  - Si hay `target` pero no hay opciones: mensaje *“Ya no se pueden programar pedidos para este turno; tu pedido se prepara lo antes posible.”* y **no** se muestra el selector.
  - Si no hay `target`: no se muestra nada.
- El rango del turno se muestra con `formatSlot(target)`.
- En `handleSubmit`: `if (selectedTime) dto.desiredDeliveryTime = selectedTime;`. Si no se eligió hora, se envía sin el campo.
- Los errores del backend siguen mostrándose en el bloque `error` existente.

### Restricciones aplicadas:
- `desiredDeliveryTime` es opcional: “Lo antes posible” no envía el campo.
- Las opciones se generan solo dentro de `[max(ahora + minimumDeliveryTime, target.startDate), target.maxOrderDate]`, inclusive.
- Formato de hora en `America/Argentina/Buenos_Aires` con `Intl`; sin `getDay()`/`getHours()`.
- El backend revalida la ventana; el front muestra su `message`.
- Sin dependencias nuevas ni cambios de theming/layout fuera de la card nueva.
- Límite de 2 archivos.
- Al terminar actualizo `documentation/resumen.md` con el plan y el resumen de lo hecho.
- Verificación final: `npx tsc --noEmit`, `npm run build` y `npm test`.

### Resumen de lo realizado
- `lib/api/orders.ts`: `CreateOrderDto` ahora incluye `desiredDeliveryTime?: string`.
- `CheckoutContent.tsx`:
  - `now` se setea post-mount para evitar mismatch de hidratación.
  - Se calculan `target` con `getTargetShift` y `timeOptions` con pasos de 15 minutos, desde `max(ahora + minimumDeliveryTime, target.startDate)` hasta `target.maxOrderDate`, inclusive.
  - Nueva card “Horario del pedido” con `<select>` (`Lo antes posible` + horas `HH:mm` en TZ AR).
  - Si hay turno objetivo pero no hay opciones, se muestra el mensaje acordado y se oculta el selector.
  - Si no hay turno objetivo, no se muestra la card.
  - `handleSubmit` agrega `desiredDeliveryTime` solo si se eligió una hora; el rango del turno se muestra con `formatSlot`.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK y `npm test` con **16/16 tests pasando**.

---

## Plan de Acción — F4b: Mover y testear `buildTimeOptions`

**Agente activo:** QA (frontend)
**Caso de uso de referencia:** CU-01 (Registrar pedido)
**Skills que se aplicarán:** `SKILL-component-structure`
**Archivos a modificar:**
- `lib/utils/schedule.ts`
- `lib/utils/schedule.test.ts`

### Cambios:
- Exportar `buildTimeOptions` desde `lib/utils/schedule.ts`, recibiendo `now` explícito y con el mismo paso de 15 minutos.
- Agregar un comentario indicando que el alineado por epoch asume un offset horario entero (AR = -03:00).
- Mantener la función local de `CheckoutContent.tsx` hasta F4c.
- Agregar tests unitarios:
  1. Viernes 22:00, turno 20:00–02:00, mínimo 30 → última opción sábado 01:30.
  2. `maxOrderDate` no múltiplo de 15 (`01:40`) → última opción 01:30.
  3. Lista vacía cuando `now + mínimo > maxOrderDate`.
  4. Borde inclusivo: `maxOrderDate` exactamente en múltiplo de 15.
  5. Viernes 22:07, mínimo 30 → primera opción 22:45.
  6. Entre turnos (lunes 16:00, próximo turno 20:00) → primera opción = `startDate` del turno siguiente.

### Resumen de lo realizado
- `buildTimeOptions` quedó exportada en `schedule.ts` con `now` explícito y el comentario del offset entero.
- Se agregaron los 6 tests en `schedule.test.ts`.
- El test de borde inclusivo usa `now = 01:00`, mínimo 30 y tope 01:30 para que el borde coincida exactamente con un múltiplo de 15.
- Verificación: `npx tsc --noEmit` OK, `npm test` con **22/22 tests pasando** y `npm run build` OK.

---

## Plan de Acción — F4c: Integrar `buildTimeOptions`, refrescar `now` y limpiar selección

**Agente activo:** Dominio (frontend)
**Caso de uso de referencia:** CU-01 (Registrar pedido)
**Skill que se aplicará:** `SKILL-component-structure`
**Archivo a modificar:** `app/(public)/[tenant]/checkout/CheckoutContent.tsx`

### Cambios:
- Importar `buildTimeOptions` desde `lib/utils/schedule.ts`.
- Eliminar la constante local `TIME_STEP_MINUTES` y la función local `buildTimeOptions`.
- Envolver `timeOptions` en `useMemo` con dependencias `[target, tenant.minimumDeliveryTime, now]`.
- Refrescar `now` cada 60 segundos con `setInterval`, limpiando el intervalo al desmontar.
- Si `selectedTime` deja de estar entre las opciones, limpiarlo y mostrar debajo del selector:
  *“El horario que elegiste ya no está disponible; elegí otro o dejalo en ‘Lo antes posible’.”*
- Ocultar el aviso apenas el usuario cambia el selector.
- No cambiar theming, layout ni validaciones del checkout.

### Resumen de lo realizado
- `CheckoutContent.tsx` usa `buildTimeOptions` importada y ya no tiene la copia local.
- `now` se refresca cada 60 s y `timeOptions` está memoizado.
- Si la selección deja de ser válida, se limpia y aparece el aviso; el `onChange` del selector lo oculta.
- Verificación: `npx tsc --noEmit` OK, `npm test` con **22/22 tests pasando**, `npm run build` OK y `npm run lint` con **6 errores y 5 warnings** (baseline, sin issues nuevos en `CheckoutContent.tsx`).

---

## Plan de Acción — F5: Portada y seguimiento

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** CU-01 / CU-08 (consultar estado)
**Skills que se aplicarán:** `SKILL-component-structure`, `SKILL-tenant-theming`

### Archivos a modificar:
- `app/(public)/[tenant]/page.tsx` — reemplazar `getTodaySchedule` por `getTargetShift`, con fallback a `getEffectiveDaySchedule`.
- `app/(public)/[tenant]/pedido/[uuid]/PedidoContent.tsx` — reemplazar `formatScheduleRange` y `getTodaySchedule` por el label basado en `getTargetShift`, con el mismo fallback.

### Cambios:
- Portada:
  - `target = getTargetShift(regular, exceptions, tenant.minimumDeliveryTime)`.
  - Si hay target: `scheduleLabel = formatSlot(target)`.
  - Si no hay target: `getEffectiveDaySchedule(regular, exceptions, getZonedDateKey()).slots.map(formatSlot).join(', ')`; si queda vacío, `null`.
  - `StatusBadge` sigue recibiendo `tenant.isOpen` sin cambios.
- Seguimiento:
  - Mismo cálculo de `scheduleLabel`.
  - Eliminar `getTodaySchedule`, `formatScheduleRange` y el `DAY_NAMES` local que solo se usaba ahí.
- El sufijo `(+1)` queda incluido por `formatSlot` cuando `closesNextDay` es `true`.

### Boceto:
```tsx
const target = getTargetShift(
  tenant.schedule.regular,
  tenant.schedule.exceptions,
  tenant.minimumDeliveryTime,
);

const fallbackLabel = getEffectiveDaySchedule(
  tenant.schedule.regular,
  tenant.schedule.exceptions,
  getZonedDateKey(),
).slots.map(formatSlot).join(', ');

const scheduleLabel = target ? formatSlot(target) : fallbackLabel || null;
```

### Restricciones aplicadas:
- No derivar “abierto/cerrado” del horario: `StatusBadge` sigue usando `tenant.isOpen`.
- No cambiar el theming ni el layout.
- No duplicar formateo: se usa `formatSlot`.
- En la portada el cálculo corre en el Server Component; en seguimiento, en el cliente. En ambos casos `getTargetShift` usa TZ AR y `Intl`.
- **Nota de límite:** `getTodaySchedule` queda sin uso tras F5; eliminarlo de `lib/utils/schedule.ts` sería un tercer archivo. Propongo dejarlo deprecado para una limpieza posterior (F5b) o incluirlo si autorizás 3 archivos.
- Al terminar actualizo `documentation/resumen.md` con el plan y el resumen.
- Verificación final: `npx tsc --noEmit`, `npm run build` y `npm test`.

### Resumen de lo realizado
- `page.tsx`: el label de la portada ahora sale de `getTargetShift`; si no hay turno objetivo, usa las franjas efectivas del día. `StatusBadge` sigue usando `tenant.isOpen`.
- `PedidoContent.tsx`: se reemplazó `getTodaySchedule`/`formatScheduleRange` por el mismo cálculo basado en `getTargetShift` + fallback; se eliminaron `DAY_NAMES` y `formatScheduleRange`.
- El sufijo `(+1)` se muestra vía `formatSlot` cuando corresponde.
- `getTodaySchedule` quedó sin uso; se eliminó en F5b.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK y `npm test` con **16/16 tests pasando**.

---

## Plan de Acción — F5b: Limpieza de `getTodaySchedule`

**Agente activo:** QA (frontend)
**Caso de uso de referencia:** Infraestructura de horarios
**Skills que se aplicarán:** `SKILL-api-consumption`

### Archivos a modificar:
- `lib/utils/schedule.ts` — eliminar el wrapper `@deprecated getTodaySchedule`, que quedó sin uso tras F5.

### Restricciones aplicadas:
- No cambiar la lógica de `getEffectiveDaySchedule`, `getTargetShift`, `formatSlot` ni `buildWeekSchedule`.
- Verificar que ningún componente lo importe antes de eliminarlo.
- Límite: 1 archivo de código.

### Resumen de lo realizado
- Se eliminó `getTodaySchedule` de `lib/utils/schedule.ts`.
- Se verificó que ya no quedaban usos en `app/`, `components/` ni `lib/`.
- Se actualizaron la tabla de estados del plan y la referencia de `documentation/FRONTEND.md`.
- Verificación: `npx tsc --noEmit` OK, `npm run build` OK y `npm test` con **16/16 tests pasando**.

---

## Plan de Acción — F5c: Eliminar riesgo de hidratación en seguimiento e info

**Agente activo:** Dominio (frontend)
**Pantallas/flujos de referencia:** CU-01 / CU-08 (seguimiento) e info del negocio
**Skill que se aplicará:** `SKILL-component-structure`
**Archivos a modificar:**
- `app/(public)/[tenant]/pedido/[uuid]/PedidoContent.tsx`
- `app/(public)/[tenant]/info/InfoNegocioContent.tsx`

### Cambios:
- Calcular el label post-mount con un estado `now` inicializado en `null` y seteado en `useEffect`, igual que en `CheckoutContent`.
- En `PedidoContent`, calcular `target` y `fallbackLabel` solo cuando `now` existe.
- En `InfoNegocioContent`, calcular `weekSchedule` y `todaySchedule` solo cuando `now` existe.
- Mientras `now` sea `null`, no renderizar la sección de horario semanal (ni la grilla ni “Cerrado”), para evitar parpadeo con datos falsos.
- No modificar `buildWeekSchedule` ni `schedule.ts`.

### Revisión de `buildWeekSchedule`
`buildWeekSchedule` no acepta `now`; usa `getZonedDateKey()` internamente. Para el patrón post-mount no hace falta modificarlo: se invoca recién después de montar y el cálculo ocurre en el cliente.

### Resumen de lo realizado
- `PedidoContent.tsx`: `now` se setea post-mount y el bloque de horario se calcula solo con ese valor.
- `InfoNegocioContent.tsx`: `now` se setea post-mount; la sección completa de horarios no se renderiza hasta tener `now`.
- No se tocó `schedule.ts`.
- `InfoNegocioModal.tsx` quedó fuera de alcance; se confirmó que ejecuta `buildWeekSchedule` en cada render y se propuso F5d.
- Verificación: `npx tsc --noEmit` OK, `npm test` con **22/22 tests pasando**, `npm run build` OK y `npm run lint` con **6 errores y 5 warnings** (baseline, sin issues nuevos en los dos archivos).

---

## Plan de Acción — F5d: Calcular horarios del modal solo al abrir

**Agente activo:** Dominio (frontend)
**Pantalla/flujo de referencia:** Info del negocio desde el menú
**Skill que se aplicará:** `SKILL-component-structure`
**Archivo a modificar:** `components/public/InfoNegocioModal.tsx`

### Cambios:
- Mover el cálculo de `weekSchedule` para que ocurra solo cuando `isOpen` sea `true`.
- Calcular `hasAnyOpenDay` a partir de ese `weekSchedule`.
- Como `isOpen` arranca en `false` en servidor y cliente, el HTML inicial no calcula horarios y no hay riesgo de hidratación.
- No tocar `schedule.ts`.

### Resumen de lo realizado
- Se confirmó que `weekSchedule` y `hasAnyOpenDay` solo se usan dentro del bloque `{isOpen && (...)}`.
- `weekSchedule` ahora se calcula solo con el modal abierto:
  `const weekSchedule = isOpen ? buildWeekSchedule(...) : [];`
- `hasAnyOpenDay` se deriva del mismo `weekSchedule`.
- Verificación: `npx tsc --noEmit` OK, `npm test` con **22/22 tests pasando**, `npm run build` OK y `npm run lint` con **6 errores y 5 warnings** (baseline, sin issues nuevos en `InfoNegocioModal.tsx`).
