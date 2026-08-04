import type { OrderStatus } from '@/lib/api/orders';

export type OrderActionVariant = 'primary' | 'success' | 'danger';

export interface OrderAction {
  label: string;
  next: OrderStatus;
  variant: OrderActionVariant;
  icon: string;
}

export const ACTIONS: Record<OrderStatus, OrderAction[]> = {
  PENDIENTE: [
    { label: 'Confirmar', next: 'EN_PREPARACION', variant: 'primary', icon: 'play_arrow' },
    { label: 'Cancelar', next: 'CANCELADO', variant: 'danger', icon: 'close' },
  ],
  EN_PREPARACION: [
    { label: 'Listo', next: 'LISTO', variant: 'success', icon: 'done_all' },
    { label: 'Cancelar', next: 'CANCELADO', variant: 'danger', icon: 'close' },
  ],
  LISTO: [
    { label: 'Entregar', next: 'ENTREGADO', variant: 'success', icon: 'delivery_dining' },
    { label: 'No retirado', next: 'NO_RETIRADO', variant: 'danger', icon: 'block' },
  ],
  ENTREGADO: [],
  CANCELADO: [],
  NO_RETIRADO: [],
};

export const VARIANT_CLASSES: Record<OrderActionVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  success: 'bg-order-ready text-white hover:opacity-90',
  danger: 'bg-slate-200 text-slate-600 hover:bg-slate-300',
};
