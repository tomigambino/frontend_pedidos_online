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

const EXCLUDED_KEYS = new Set(['logo', 'banner']);

export function updateTenant(slug: string, dto: Partial<UpdateTenantDto>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined || value === null || EXCLUDED_KEYS.has(key)) continue;
    fd.append(key, String(value));
  }
  return apiClient<TenantConfigResponseDto>(`/${slug}/admin/tenants`, {
    method: 'PATCH',
    body: fd,
  });
}

export function updateTenantWithFiles(
  slug: string,
  dto: Partial<UpdateTenantDto>,
  files: { logo: File | null; banner: File | null },
) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined || value === null || EXCLUDED_KEYS.has(key)) continue;
    fd.append(key, String(value));
  }
  if (files.logo) fd.append('logo', files.logo);
  if (files.banner) fd.append('banner', files.banner);
  return apiClient<TenantConfigResponseDto>(`/${slug}/admin/tenants`, {
    method: 'PATCH',
    body: fd,
  });
}

export function getTenantConfig(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/availability`);
}

export interface CreateScheduleDto {
  dayOfWeek: number;
  openingTime: string;
  closingTime: string;
}

export function getSchedule(slug: string) {
  return apiClient<RegularScheduleDto[]>(`/${slug}/admin/schedule`);
}

export function createScheduleSlot(slug: string, dto: CreateScheduleDto) {
  return apiClient<RegularScheduleDto>(`/${slug}/admin/schedule`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateScheduleSlot(
  slug: string,
  id: string,
  dto: Partial<CreateScheduleDto>,
) {
  return apiClient<RegularScheduleDto>(`/${slug}/admin/schedule/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteScheduleSlot(slug: string, id: string) {
  await apiClient<unknown>(`/${slug}/admin/schedule/${id}`, { method: 'DELETE' });
}

export interface CreateExceptionDto {
  date: string;
  isOpen: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  reason?: string | null;
}

export function getExceptions(slug: string) {
  return apiClient<ExceptionDto[]>(`/${slug}/admin/exceptions`);
}

export function createException(slug: string, dto: CreateExceptionDto) {
  return apiClient<ExceptionDto>(`/${slug}/admin/exceptions`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteException(slug: string, id: string) {
  await apiClient<unknown>(`/${slug}/admin/exceptions/${id}`, { method: 'DELETE' });
}

export function deleteTenantLogo(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/admin/tenants/logo`, {
    method: 'DELETE',
  });
}

export function deleteTenantBanner(slug: string) {
  return apiClient<TenantConfigResponseDto>(`/${slug}/admin/tenants/banner`, {
    method: 'DELETE',
  });
}