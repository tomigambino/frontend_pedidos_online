'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  createOrder,
  type CreateOrderDto,
  type DeliveryType,
  type OrderResponseDto,
  type PaymentMethod,
} from '@/lib/api/orders';
import type { ProductResponseDto } from '@/lib/api/products';
import type { CategoryResponseDto } from '@/lib/api/categories';
import { isValidImageUrl } from '@/lib/utils/image';

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

interface CreateOrderModalProps {
  slug: string;
  products: ProductResponseDto[];
  categories: CategoryResponseDto[];
  loading?: boolean;
  onClose: () => void;
  onCreated: (order: OrderResponseDto) => void;
}

export function CreateOrderModal({
  slug,
  products,
  categories,
  loading = false,
  onClose,
  onCreated,
}: CreateOrderModalProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string> | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RETIRO_LOCAL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const normalizedSearch = search.trim().toLowerCase();
  const isSearching = normalizedSearch.length > 0;

  const groups = useMemo(() => {
    const productsByCategory = new Map<string, ProductResponseDto[]>();
    for (const product of products) {
      const existing = productsByCategory.get(product.categoryId) ?? [];
      existing.push(product);
      productsByCategory.set(product.categoryId, existing);
    }
    return categories
      .map((category) => ({
        category,
        allProducts: productsByCategory.get(category.id) ?? [],
      }))
      .filter((group) => group.allProducts.length > 0);
  }, [categories, products]);

  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          category: group.category,
          allProducts: group.allProducts,
          products: isSearching
            ? group.allProducts.filter((p) =>
                p.name.toLowerCase().includes(normalizedSearch),
              )
            : group.allProducts,
        }))
        .filter((group) => group.products.length > 0),
    [groups, isSearching, normalizedSearch],
  );

  const defaultOpen = useMemo(
    () => (groups[0] ? new Set([groups[0].category.id]) : new Set<string>()),
    [groups],
  );

  const openSet = openCategories ?? defaultOpen;

  function isCategoryOpen(categoryId: string): boolean {
    return isSearching ? true : openSet.has(categoryId);
  }

  function toggleCategory(categoryId: string) {
    if (isSearching) return;
    setOpenCategories((prev) => {
      const next = new Set(prev ?? defaultOpen);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  const allVisibleOpen =
    visibleGroups.length > 0 &&
    visibleGroups.every((group) => openSet.has(group.category.id));

  function toggleAll() {
    if (allVisibleOpen) {
      setOpenCategories(new Set());
    } else {
      setOpenCategories(new Set(visibleGroups.map((group) => group.category.id)));
    }
  }

  function categoryUnits(groupProducts: ProductResponseDto[]): number {
    return groupProducts.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0);
  }

  const matchCount = visibleGroups.reduce(
    (sum, group) => sum + group.products.length,
    0,
  );

  const selectedItems = useMemo(
    () =>
      products
        .filter((p) => (quantities[p.id] ?? 0) > 0)
        .map((p) => ({ productId: p.id, quantity: quantities[p.id] })),
    [products, quantities],
  );

  const subtotal = useMemo(
    () =>
      products.reduce(
        (sum, p) => sum + p.price * (quantities[p.id] ?? 0),
        0,
      ),
    [products, quantities],
  );

  const totalUnits = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
    [quantities],
  );

  function setQuantity(productId: string, quantity: number) {
    setQuantities((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: quantity };
    });
  }

  function selectDelivery(next: DeliveryType) {
    setDeliveryType(next);
    if (next === 'ENVIO_DOMICILIO' && paymentMethod === 'TARJETA_DEBITO') {
      setPaymentMethod('EFECTIVO');
    }
  }

  function validate(): boolean {
    const newErrors: typeof fieldErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Ingresá el nombre del cliente';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim())) {
      newErrors.name = 'El nombre no puede contener números';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Ingresá el teléfono';
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
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (submitting) return;
    setError(null);

    if (selectedItems.length === 0) {
      setError('Agregá al menos un producto');
      return;
    }
    if (!validate()) return;

    const dto: CreateOrderDto = {
      items: selectedItems,
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
      const created = await createOrder(slug, dto);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = selectedItems.length > 0 && !submitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-t-xl md:rounded-xl shadow-lg flex flex-col overflow-hidden antialiased max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 bg-white shrink-0">
          <h2 className="text-lg font-bold text-foreground">Nuevo pedido</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-black/5 text-muted hover:text-primary transition-colors flex items-center justify-center disabled:opacity-40"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Productos
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full h-11 pl-10 pr-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={visibleGroups.length === 0 || isSearching}
                className="shrink-0 h-11 px-3 flex items-center gap-1.5 rounded-lg border border-black/15 text-sm font-semibold text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-40 disabled:hover:text-muted disabled:hover:border-black/15"
              >
                <span className="material-symbols-outlined text-lg">
                  {allVisibleOpen ? 'collapse_all' : 'expand_all'}
                </span>
                <span className="hidden sm:inline whitespace-nowrap">
                  {allVisibleOpen ? 'Contraer todo' : 'Expandir todo'}
                </span>
              </button>
            </div>

            {isSearching && !loading && (
              <p className="text-xs font-medium text-muted">
                {matchCount} {matchCount === 1 ? 'resultado' : 'resultados'}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted">
                <span className="material-symbols-outlined animate-spin">
                  progress_activity
                </span>
                <span className="text-sm">Cargando productos...</span>
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted py-2">
                No hay productos activos disponibles.
              </p>
            ) : visibleGroups.length === 0 ? (
              <p className="text-sm text-muted py-2">
                No hay productos que coincidan con la búsqueda.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleGroups.map((group) => {
                  const open = isCategoryOpen(group.category.id);
                  const units = categoryUnits(group.allProducts);
                  return (
                    <div
                      key={group.category.id}
                      className="border border-gray-100 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(group.category.id)}
                        aria-expanded={open}
                        className="w-full flex items-center gap-2 px-3 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-muted">
                          {open ? 'expand_less' : 'expand_more'}
                        </span>
                        <span className="flex-1 text-sm font-bold text-foreground truncate">
                          {group.category.name}
                        </span>
                        {units > 0 && (
                          <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                            {units}
                          </span>
                        )}
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {group.products.length}
                        </span>
                      </button>

                      {open && (
                        <ul className="divide-y divide-gray-100 border-t border-gray-100">
                          {group.products.map((product) => {
                            const quantity = quantities[product.id] ?? 0;
                            return (
                              <li
                                key={product.id}
                                className="flex items-center gap-3 px-3 py-2.5"
                              >
                                <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {isValidImageUrl(product.imageUrl) ? (
                                    <Image
                                      src={product.imageUrl}
                                      alt={product.name}
                                      width={44}
                                      height={44}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined text-muted text-xl">
                                      restaurant
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-sm text-primary font-bold">
                                    {formatPrice(product.price)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(product.id, quantity - 1)}
                                    disabled={quantity === 0}
                                    aria-label={`Quitar ${product.name}`}
                                    className="w-8 h-8 rounded-lg bg-black/5 text-foreground flex items-center justify-center transition-colors hover:bg-black/10 disabled:opacity-30"
                                  >
                                    <span className="material-symbols-outlined text-lg">
                                      remove
                                    </span>
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold text-foreground">
                                    {quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setQuantity(product.id, quantity + 1)}
                                    aria-label={`Agregar ${product.name}`}
                                    className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors hover:bg-primary/20"
                                  >
                                    <span className="material-symbols-outlined text-lg">
                                      add
                                    </span>
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedItems.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 text-sm">
                <span className="font-semibold text-foreground">
                  {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
                </span>
                <span className="font-bold text-primary">
                  {formatPrice(subtotal)}
                </span>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-muted">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
                {fieldErrors.name && (
                  <p className="text-red-600 text-xs">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-muted">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  placeholder="+54 9 11 0000-0000"
                  className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                />
                {fieldErrors.phone && (
                  <p className="text-red-600 text-xs">{fieldErrors.phone}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Entrega
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectDelivery('RETIRO_LOCAL')}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                  deliveryType === 'RETIRO_LOCAL'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-muted hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined mb-1 text-xl">
                  storefront
                </span>
                <span className="text-sm font-bold">Retiro local</span>
              </button>
              <button
                type="button"
                onClick={() => selectDelivery('ENVIO_DOMICILIO')}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                  deliveryType === 'ENVIO_DOMICILIO'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-muted hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined mb-1 text-xl">
                  local_shipping
                </span>
                <span className="text-sm font-bold">Envío a domicilio</span>
              </button>
            </div>

            {deliveryType === 'ENVIO_DOMICILIO' && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-muted">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Altura, Piso/Depto"
                    className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                  />
                  {fieldErrors.address && (
                    <p className="text-red-600 text-xs">{fieldErrors.address}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-muted">
                    Notas de entrega (Opcional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Ej: Portón negro, tocar timbre fuerte"
                    className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Método de pago
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(deliveryType === 'ENVIO_DOMICILIO'
                ? (['EFECTIVO', 'TRANSFERENCIA'] as PaymentMethod[])
                : (['EFECTIVO', 'TRANSFERENCIA', 'TARJETA_DEBITO'] as PaymentMethod[])
              ).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all ${
                    paymentMethod === m
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-muted hover:border-primary'
                  }`}
                >
                  {m === 'EFECTIVO' && (
                    <span className="material-symbols-outlined mb-1 text-xl">
                      payments
                    </span>
                  )}
                  {m === 'TRANSFERENCIA' && (
                    <span className="material-symbols-outlined mb-1 text-xl">
                      account_balance
                    </span>
                  )}
                  {m === 'TARJETA_DEBITO' && (
                    <span className="material-symbols-outlined mb-1 text-xl">
                      credit_card
                    </span>
                  )}
                  <span className="text-xs font-bold text-center leading-tight">
                    {m === 'EFECTIVO' && 'Efectivo'}
                    {m === 'TRANSFERENCIA' && 'Transf.'}
                    {m === 'TARJETA_DEBITO' && 'Tarjeta'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Notas (Opcional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Sin cebolla, sin salsa..."
              rows={2}
              className="w-full p-3 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm resize-none"
            />
          </section>
        </div>

        <div className="px-5 py-4 border-t border-black/10 bg-white shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 flex items-center justify-center text-sm font-semibold text-primary bg-transparent border border-primary rounded-lg hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-[2] h-11 flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            {submitting ? (
              <span className="material-symbols-outlined text-xl animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-outlined text-xl">check</span>
            )}
            {submitting
              ? 'Creando pedido...'
              : `Crear pedido${totalUnits > 0 ? ` (${formatPrice(subtotal)})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
