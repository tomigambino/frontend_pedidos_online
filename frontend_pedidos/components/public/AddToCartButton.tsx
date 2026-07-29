'use client';
import { useState } from 'react';
import { useCart } from '@/lib/context/CartContext';

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
}

export function AddToCartButton({ productId, name, price }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const handleClick = () => {
    addItem({ productId, name, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (added) {
    return (
      <button
        disabled
        className="mt-3 flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[var(--color-status-open)] text-white text-sm font-bold leading-normal w-fit gap-1.5"
      >
        <span className="material-symbols-outlined text-sm">check</span>
        <span className="truncate">Agregado</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="mt-3 flex min-w-[100px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-bold leading-normal w-fit transition-transform active:scale-95"
    >
      <span className="truncate">+ Agregar</span>
    </button>
  );
}
