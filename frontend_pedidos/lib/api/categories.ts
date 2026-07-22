import { apiClient } from './client';

export interface CategoryResponseDto {
  id: string;
  name: string;
  productCount: number;
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
