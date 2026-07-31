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
    <div className="relative flex min-h-screen w-full flex-col bg-white">
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
