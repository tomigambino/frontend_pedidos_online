import { apiClient } from './client';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO';
export type DeliveryType = 'RETIRO_LOCAL' | 'ENVIO_DOMICILIO';

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  address?: string;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  customer: CreateCustomerDto;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  address?: string;
  notes?: string;
  deliveryNotes?: string;
}

export interface OrderResponseDto {
  id: string;
  tenantId: string;
  status: string;
  trackingUuid: string;
  cancellationReason: string | null;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryType: DeliveryType;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  };
  delivery: DeliveryResponseDto | null;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryResponseDto {
  address: string;
  notes: string | null;
  deliveryFee: number;
}

export function getOrderByTracking(slug: string, trackingUuid: string) {
  return apiClient<OrderResponseDto>(`/${slug}/orders/${trackingUuid}/track`);
}

export function createOrder(slug: string, dto: CreateOrderDto) {
  return apiClient<OrderResponseDto>(`/${slug}/orders`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
