'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type {
  DeliveryType,
  OrderResponseDto,
  PaymentMethod,
} from '@/lib/api/orders';
import type { TenantConfigResponseDto } from '@/lib/api/tenants';
import { APP_TIMEZONE } from '@/lib/utils/schedule';
import { isValidImageUrl } from '@/lib/utils/image';

type PrintFormat = 'cocina' | 'recibo';

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  ENVIO_DOMICILIO: 'Envío a domicilio',
  RETIRO_LOCAL: 'Retiro en local',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA_DEBITO: 'Tarjeta de débito',
};

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`;
}

function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

function shortId(order: OrderResponseDto): string {
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}

function ComandaCocina({ order }: { order: OrderResponseDto }) {
  return (
    <div className="space-y-2">
      <div className="text-center">
        <p className="text-base font-bold tracking-widest">COMANDA</p>
        <p className="text-[10px] uppercase tracking-[0.3em]">Cocina</p>
      </div>

      <div className="space-y-0.5 border-t border-dashed border-black pt-2">
        <p className="text-sm font-bold">{shortId(order)}</p>
        <p>{formatDateTime(order.createdAt)}</p>
        <p className="font-bold uppercase">
          {DELIVERY_LABELS[order.deliveryType]}
        </p>
      </div>

      <div className="space-y-1 border-t border-dashed border-black pt-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <span className="w-8 shrink-0 font-bold">{item.quantity}x</span>
            <span className="font-bold uppercase">{item.name}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="border-t border-dashed border-black pt-2">
          <p className="text-[10px] font-bold uppercase">Notas</p>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {order.delivery?.notes && (
        <div className="border-t border-dashed border-black pt-2">
          <p className="text-[10px] font-bold uppercase">Notas de entrega</p>
          <p className="whitespace-pre-wrap">{order.delivery.notes}</p>
        </div>
      )}
    </div>
  );
}

function Recibo({
  order,
  tenant,
}: {
  order: OrderResponseDto;
  tenant: TenantConfigResponseDto;
}) {
  const address = order.delivery?.address ?? order.customer.address;

  return (
    <div className="space-y-2">
      <div className="space-y-1 text-center">
        {isValidImageUrl(tenant.logo) ? (
          <Image
            src={tenant.logo}
            alt={tenant.name}
            width={120}
            height={48}
            className="mx-auto h-12 w-auto object-contain"
          />
        ) : (
          <p className="text-base font-bold uppercase">{tenant.name}</p>
        )}
        {tenant.address && <p className="text-[10px]">{tenant.address}</p>}
        {tenant.whatsapp && <p className="text-[10px]">Tel: {tenant.whatsapp}</p>}
      </div>

      <div className="space-y-0.5 border-t border-dashed border-black pt-2">
        <p className="text-sm font-bold">{shortId(order)}</p>
        <p>{formatDateTime(order.createdAt)}</p>
      </div>

      <div className="space-y-0.5 border-t border-dashed border-black pt-2">
        <p>
          <span className="font-bold">Cliente:</span> {order.customer.name}
        </p>
        <p>
          <span className="font-bold">Tel:</span> {order.customer.phone}
        </p>
        <p>
          <span className="font-bold">Entrega:</span>{' '}
          {DELIVERY_LABELS[order.deliveryType]}
        </p>
        {address && (
          <p>
            <span className="font-bold">Dirección:</span> {address}
          </p>
        )}
        <p>
          <span className="font-bold">Pago:</span>{' '}
          {PAYMENT_LABELS[order.paymentMethod]}
        </p>
      </div>

      <div className="space-y-1 border-t border-dashed border-black pt-2">
        {order.items.map((item) => (
          <div key={item.id}>
            <p className="uppercase">
              {item.quantity}x {item.name}
            </p>
            <div className="flex justify-between">
              <span>{formatPrice(item.price)} c/u</span>
              <span className="font-bold">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black pt-2">
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="border-t border-dashed border-black pt-2">
          <p className="text-[10px] font-bold uppercase">Notas</p>
          <p className="whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {order.delivery?.notes && (
        <div className="border-t border-dashed border-black pt-2">
          <p className="text-[10px] font-bold uppercase">Notas de entrega</p>
          <p className="whitespace-pre-wrap">{order.delivery.notes}</p>
        </div>
      )}
    </div>
  );
}

export function OrderPrintDialog({
  order,
  tenant,
  onClose,
}: {
  order: OrderResponseDto;
  tenant: TenantConfigResponseDto;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<PrintFormat>('cocina');

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="print-root"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="no-print absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl bg-white shadow-lg sm:max-w-md sm:rounded-xl">
        <div className="no-print flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3">
          <div className="flex rounded-lg bg-black/5 p-1">
            {(['cocina', 'recibo'] as PrintFormat[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  format === option
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {option === 'cocina' ? 'Cocina' : 'Recibo'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-muted transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="print-preview flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="mx-auto w-[80mm] max-w-full bg-white p-3 font-mono text-[12px] leading-snug text-black">
            {format === 'cocina' ? (
              <ComandaCocina order={order} />
            ) : (
              <Recibo order={order} tenant={tenant} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
