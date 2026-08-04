import { apiClient } from './client';

export interface RegularScheduleDto {
  id: string;
  dayOfWeek: number;
  openingTime: string;
  closingTime: string;
}

export interface ExceptionDto {
  id: string;
  date: string;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  reason: string | null;
}

export interface TenantConfigResponseDto {
  name: string;
  logo: string | null;
  banner: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  description: string | null;
  whatsapp: string | null;
  address: string | null;
  isOpen: boolean;
  deliveryCostEnabled: boolean;
  deliveryCost: number | null;
  cbu: string | null;
  alias: string | null;
  accountHolder: string | null;
  bank: string | null;
  schedule: {
    regular: RegularScheduleDto[];
    exceptions: ExceptionDto[];
  };
}

export function getTenantAvailability(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/availability`);
}

export interface UpdateTenantDto {
  name?: string;
  logo?: string | null;
  banner?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  description?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  cbu?: string | null;
  alias?: string | null;
  accountHolder?: string | null;
  bank?: string | null;
  isOpen?: boolean;
  deliveryCostEnabled?: boolean;
  deliveryCost?: number | null;
}

export function updateTenant(slug: string, dto: UpdateTenantDto) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/admin/tenants`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}
