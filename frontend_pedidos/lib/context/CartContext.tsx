'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const LEGACY_STORAGE_KEY = 'cart';

function readCart(key: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  } catch {
    // localStorage bloqueado o datos corruptos — arranca con carrito vacío
    return [];
  }
}

function writeCart(key: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // no se pudo persistir (storage lleno o bloqueado) — la sesión sigue funcionando en memoria
  }
}

export function CartProvider({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug: string;
}) {
  const storageKey = `cart_${slug}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga post-mount desde localStorage; evita mismatch de hidratación
    setItems(readCart(storageKey));
    setLoadedKey(storageKey);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // storage bloqueado — se sigue trabajando en memoria
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) return;
    writeCart(storageKey, items);
  }, [storageKey, items, loadedKey]);

  const addItem: CartContextValue['addItem'] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const updateQuantity = (productId: string, quantity: number) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
