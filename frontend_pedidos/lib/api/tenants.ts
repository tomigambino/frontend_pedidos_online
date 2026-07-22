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
  schedule: {
    regular: RegularScheduleDto[];
    exceptions: ExceptionDto[];
  };
}

export function getTenantAvailability(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/availability`);
}
