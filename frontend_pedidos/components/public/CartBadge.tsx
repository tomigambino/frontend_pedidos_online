'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/context/CartContext';

export function CartBadge() {
  const { items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white px-1 outline outline-2 outline-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
