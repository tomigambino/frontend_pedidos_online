'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api/client';
import type { ProductResponseDto } from '@/lib/api/products';
import { deleteProductImage } from '@/lib/api/products';
import type { CategoryResponseDto } from '@/lib/api/categories';

interface ProductFormModalProps {
  slug: string;
  categories: CategoryResponseDto[];
  product?: ProductResponseDto;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({
  slug,
  categories,
  product,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [price, setPrice] = useState(() => {
    const value = product?.price?.toString() ?? '';
    return value ? Number(value).toLocaleString('es-AR') : '';
  });
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl ?? null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markedForDeletion, setMarkedForDeletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== product?.imageUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, product?.imageUrl]);

  const priceValue = parseInt(price.replace(/\D/g, ''), 10);
  const canSave = name.trim().length > 0 && categoryId !== '' && !Number.isNaN(priceValue);

  function formatPrice(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('es-AR');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);

    if (!file.type.startsWith('image/')) {
      setImageError('El archivo debe ser una imagen');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('La imagen no puede superar 5 MB');
      e.target.value = '';
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    if (imageFile) {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setImageFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setPreviewUrl(null);
    setMarkedForDeletion(true);
  }

  async function handleSubmit() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (markedForDeletion && !imageFile && isEdit && product) {
        await deleteProductImage(slug, product.id);
      }
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('categoryId', categoryId);
      fd.append('price', String(priceValue));
      if (description.trim()) fd.append('description', description.trim());
      if (imageFile) fd.append('image', imageFile);

      if (isEdit && product) {
        await apiClient<ProductResponseDto>(`/${slug}/products/${product.id}`, {
          method: 'PATCH',
          body: fd,
        });
      } else {
        await apiClient<ProductResponseDto>(`/${slug}/products`, {
          method: 'POST',
          body: fd,
        });
      }
      onSaved();
      onClose();
    } catch {
      setError('No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-xl md:rounded-xl shadow-lg flex flex-col overflow-hidden antialiased">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 bg-white shrink-0">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-black/5 text-muted hover:text-primary transition-colors flex items-center justify-center disabled:opacity-40"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-muted">Foto del Producto</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-black/15">
                <Image
                  src={previewUrl}
                  alt="Vista previa"
                  fill
                  unoptimized={previewUrl.startsWith('blob:')}
                  className="object-cover"
                />
                {!saving && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Quitar imagen"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="w-full h-28 bg-black/5 rounded-lg border-2 border-dashed border-black/15 flex flex-col items-center justify-center hover:bg-black/10 hover:border-primary/40 transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-4xl text-primary mb-2">
                  add_a_photo
                </span>
                <p className="text-sm text-muted">Subir imagen</p>
              </button>
            )}
            {imageError && <p className="text-red-600 text-xs font-medium">{imageError}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-muted" htmlFor="product-name">
              Nombre del Producto
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Doble Cheeseburger"
              className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-muted" htmlFor="product-category">
                Categoría
              </label>
              <div className="relative">
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-4 appearance-none bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground pr-10"
                >
                  <option value="" disabled>
                    Selecciona una categoría
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-muted" htmlFor="product-price">
                Precio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                  <span className="font-bold">$</span>
                </div>
                <input
                  id="product-price"
                  type="text"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(formatPrice(e.target.value))}
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-muted" htmlFor="product-desc">
              Descripción
            </label>
            <textarea
              id="product-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes principales, preparación..."
              className="w-full p-3 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-black/10 bg-white shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-11 flex items-center justify-center text-sm font-semibold text-primary bg-transparent border border-primary rounded-lg hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave || saving}
            className="flex-1 h-11 flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">check</span>
            {isEdit ? 'Guardar Cambios' : 'Guardar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
