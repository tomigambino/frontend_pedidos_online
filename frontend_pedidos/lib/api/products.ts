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

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string | null;
  categoryId?: string;
}

export function getProducts(slug: string, page = 1, limit = 100) {
  return apiClient<PaginatedResponse<ProductResponseDto>>(
    `/${slug}/products?page=${page}&limit=${limit}`,
  );
}

export function getProductsAdmin(slug: string, page = 1, limit = 100) {
  return apiClient<PaginatedResponse<ProductResponseDto>>(
    `/${slug}/products/admin?page=${page}&limit=${limit}`,
  );
}

export function createProduct(slug: string, dto: CreateProductDto) {
  return apiClient<ProductResponseDto>(`/${slug}/products`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export function updateProduct(slug: string, id: string, dto: UpdateProductDto) {
  return apiClient<ProductResponseDto>(`/${slug}/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteProduct(slug: string, id: string) {
  await apiClient<unknown>(`/${slug}/products/${id}`, { method: 'DELETE' });
}

export function activateProduct(slug: string, id: string) {
  return apiClient<ProductResponseDto>(`/${slug}/products/${id}/activate`, {
    method: 'PATCH',
  });
}

export function hideProduct(slug: string, id: string) {
  return apiClient<ProductResponseDto>(`/${slug}/products/${id}/hide`, {
    method: 'PATCH',
  });
}
