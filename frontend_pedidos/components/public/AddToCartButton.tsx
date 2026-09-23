'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/context/CartContext';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export function AddToCartButton({ productId, name, price, imageUrl }: AddToCartButtonProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const qty = mounted ? items.find((i) => i.productId === productId)?.quantity ?? 0 : 0;

  if (qty === 0) {
    return (
      <button
        onClick={() => addItem({ productId, name, price, imageUrl })}
        className="mt-3 flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold leading-normal w-fit transition-transform active:scale-95"
      >
        <span className="truncate">+ Agregar</span>
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 w-fit">
      <button
        onClick={() => (qty === 1 ? removeItem(productId) : updateQuantity(productId, qty - 1))}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-[var(--color-primary)] shadow-sm active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">remove</span>
      </button>
      <span className="text-sm font-bold min-w-[1.25rem] text-center text-[var(--color-foreground)]">
        {qty}
      </span>
      <button
        onClick={() => updateQuantity(productId, qty + 1)}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  );
}