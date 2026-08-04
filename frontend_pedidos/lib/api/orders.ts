import { apiClient } from './client';
import { PaginatedResponse } from './categories';

export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_DEBITO';
export type DeliveryType = 'RETIRO_LOCAL' | 'ENVIO_DOMICILIO';

export type OrderStatus =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'NO_RETIRADO';

export interface StatsResponseDto {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
}

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
  status: OrderStatus;
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

export function getStats(slug: string, cookie?: string) {
  return apiClient<StatsResponseDto>(`/${slug}/orders/admin/stats`, {
    headers: cookie ? { Cookie: cookie } : undefined,
    cache: 'no-store',
  });
}

export function getOrdersAdmin(
  slug: string,
  params: { page?: number; limit?: number } = {},
  cookie?: string,
) {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiClient<PaginatedResponse<OrderResponseDto>>(
    `/${slug}/orders${qs ? `?${qs}` : ''}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: 'no-store',
    },
  );
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function buildQuery(filters: OrderFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export function getOrdersFiltered(
  slug: string,
  filters: OrderFilters,
  cookie?: string,
) {
  const qs = buildQuery(filters);
  return apiClient<PaginatedResponse<OrderResponseDto>>(
    `/${slug}/orders${qs ? `?${qs}` : ''}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: 'no-store',
    },
  );
}

export function getOrderCounts(
  slug: string,
  filters: Omit<OrderFilters, 'status' | 'page' | 'limit'>,
  cookie?: string,
) {
  const qs = buildQuery(filters);
  return apiClient<Record<OrderStatus, number>>(
    `/${slug}/orders/admin/counts${qs ? `?${qs}` : ''}`,
    {
      headers: cookie ? { Cookie: cookie } : undefined,
      cache: 'no-store',
    },
  );
}

export function updateOrderStatus(
  slug: string,
  orderId: string,
  dto: { status: string; cancellationReason?: string },
) {
  return apiClient<OrderResponseDto>(`/${slug}/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
