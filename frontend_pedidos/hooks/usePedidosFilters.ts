'use client';

import { useEffect, useState } from 'react';
import type { OrderStatus } from '@/lib/api/orders';
import { today } from '@/lib/dates';

export { today };

export function usePedidosFilters() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string | undefined>(() => today());
  const [dateTo, setDateTo] = useState<string | undefined>(() => today());
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function showAll() {
    setDateFrom(undefined);
    setDateTo(undefined);
  }

  function resetToToday() {
    setDateFrom(today());
    setDateTo(today());
  }

  return {
    searchInput,
    setSearchInput,
    search,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    status,
    setStatus,
    showAll,
    resetToToday,
    filters: { search, dateFrom, dateTo, status },
  };
}
