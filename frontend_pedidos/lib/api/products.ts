import { apiClient } from './client';
import type { PaginatedResponse } from './categories';

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
}

export function getProducts(slug: string, page = 1, limit = 100) {
  return apiClient<PaginatedResponse<ProductResponseDto>>(
    `/${slug}/products?page=${page}&limit=${limit}`,
  );
}
