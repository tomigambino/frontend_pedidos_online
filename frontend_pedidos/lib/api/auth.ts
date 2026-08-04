import { apiClient } from './client';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AdminSession {
  email: string;
  tenantSlug: string;
  tenantName: string;
}

export function login(dto: LoginDto) {
  return apiClient<{ success: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function getMe(cookie?: string) {
  return apiClient<AdminSession>('/auth/me', {
    headers: cookie ? { Cookie: cookie } : undefined,
    cache: 'no-store',
  });
}
