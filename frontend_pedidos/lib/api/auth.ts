import { apiClient } from './client';

export interface LoginDto {
  email: string;
  password: string;
}

export function login(dto: LoginDto) {
  return apiClient<{ success: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
