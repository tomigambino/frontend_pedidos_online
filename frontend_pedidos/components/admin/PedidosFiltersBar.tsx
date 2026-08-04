'use client';

import { useState } from 'react';
import type { OrderStatus } from '@/lib/api/orders';
import { today, usePedidosFilters } from '@/hooks/usePedidosFilters';

const MONTHS_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const TABS: { label: string; status?: OrderStatus; hoverClass: string }[] = [
  { label: 'General', hoverClass: 'hover:bg-rose-50' },
  { label: 'Pendientes', status: 'PENDIENTE', hoverClass: 'hover:bg-order-new/10' },
  { label: 'En Preparación', status: 'EN_PREPARACION', hoverClass: 'hover:bg-order-preparing/10' },
  { label: 'Listos', status: 'LISTO', hoverClass: 'hover:bg-order-ready/10' },
  { label: 'Entregados', status: 'ENTREGADO', hoverClass: 'hover:bg-order-delivered/10' },
  { label: 'Cancelados', status: 'CANCELADO', hoverClass: 'hover:bg-gray-100' },
  { label: 'No Retirados', status: 'NO_RETIRADO', hoverClass: 'hover:bg-gray-100' },
];

function formatShort(date: string) {
  const [, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]}`;
}

function buildDateLabel(dateFrom?: string, dateTo?: string) {
  if (dateFrom && dateTo) return `${formatShort(dateFrom)} - ${formatShort(dateTo)}`;
  if (dateFrom) return `Desde ${formatShort(dateFrom)}`;
  if (dateTo) return `Hasta ${formatShort(dateTo)}`;
  return null;
}

export function PedidosFiltersBar({
  filtersHook,
  counts,
}: {
  filtersHook: ReturnType<typeof usePedidosFilters>;
  counts: Record<OrderStatus, number>;
}) {
  const {
    searchInput,
    setSearchInput,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    status,
    setStatus,
    showAll,
    resetToToday,
  } = filtersHook;
  const [pickerOpen, setPickerOpen] = useState(false);

  const isToday = dateFrom === today() && dateTo === today();
  const isAll = !dateFrom && !dateTo;
  const dateLabel = isAll ? null : isToday ? 'Hoy' : buildDateLabel(dateFrom, dateTo);
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="relative group max-w-md w-full mb-6">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
          search
        </span>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:border-primary focus:outline-none bg-white transition-all text-sm shadow-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 px-1">
        <div className="flex items-center rounded-xl border border-primary bg-rose-50 text-primary shadow-sm">
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            className="flex items-center gap-2 px-4 py-2.5 font-semibold tracking-wider transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">calendar_today</span>
            <span>{dateLabel ?? 'Filtrar por fecha'}</span>
          </button>
          {!isToday && (
            <button
              type="button"
              aria-label="Volver a hoy"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen(false);
                resetToToday();
              }}
              className="flex items-center justify-center px-2 py-2.5 hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {!isAll && (
          <button
            type="button"
            onClick={() => {
              setPickerOpen(false);
              showAll();
            }}
            className="text-muted hover:text-primary font-semibold text-sm px-2 py-1 transition-colors"
          >
            Ver todos los pedidos
          </button>
        )}

        {pickerOpen && (
          <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Desde</span>
              <input
                type="date"
                value={dateFrom ?? ''}
                onChange={(e) => setDateFrom(e.target.value || undefined)}
                className="rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <span className="text-muted">a</span>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Hasta</span>
              <input
                type="date"
                value={dateTo ?? ''}
                onChange={(e) => setDateTo(e.target.value || undefined)}
                className="rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>

      <nav className="flex overflow-x-auto gap-3 pb-4 mb-6">
        {TABS.map((tab) => {
          const active = status === tab.status;
          const count = tab.status ? counts[tab.status] ?? 0 : totalCount;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatus(tab.status)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold tracking-wider flex items-center gap-2 transition-all active:scale-95 ${
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : `bg-white border border-gray-100 text-foreground ${tab.hoverClass}`
              }`}
            >
              {tab.label}
              <span className={`text-xs ${active ? 'opacity-90' : 'text-muted'}`}>({count})</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
