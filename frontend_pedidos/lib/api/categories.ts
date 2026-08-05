import { apiClient } from './client';

export interface CategoryResponseDto {
  id: string;
  name: string;
  productCount: number;
  isActive: boolean;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getCategories(slug: string, page = 1, limit = 100) {
  return apiClient<PaginatedResponse<CategoryResponseDto>>(
    `/${slug}/categories?page=${page}&limit=${limit}`,
  );
}

export function getCategoriesAdmin(slug: string, page = 1, limit = 100) {
  return apiClient<PaginatedResponse<CategoryResponseDto>>(
    `/${slug}/categories/admin?page=${page}&limit=${limit}`,
  );
}

export function createCategory(slug: string, dto: CreateCategoryDto) {
  return apiClient<CategoryResponseDto>(`/${slug}/categories`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateCategory(slug: string, id: string, dto: UpdateCategoryDto) {
  return apiClient<CategoryResponseDto>(`/${slug}/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteCategory(slug: string, id: string) {
  await apiClient<unknown>(`/${slug}/categories/${id}`, { method: 'DELETE' });
}

export function activateCategory(slug: string, id: string) {
  return apiClient<CategoryResponseDto>(`/${slug}/categories/${id}/activate`, {
    method: 'PATCH',
  });
}

export function hideCategory(slug: string, id: string) {
  return apiClient<CategoryResponseDto>(`/${slug}/categories/${id}/hide`, {
    method: 'PATCH',
  });
}
