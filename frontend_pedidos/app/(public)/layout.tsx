import { CartProvider } from '@/lib/context/CartContext';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
