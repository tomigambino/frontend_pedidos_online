'use client';

import { useState } from 'react';
import { createCategory, updateCategory, type CategoryResponseDto } from '@/lib/api/categories';

interface CategoryFormModalProps {
  slug: string;
  category?: CategoryResponseDto;
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryFormModal({ slug, category, onClose, onSaved }: CategoryFormModalProps) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  async function handleSubmit() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit && category) {
        await updateCategory(slug, category.id, { name: name.trim() });
      } else {
        await createCategory(slug, { name: name.trim() });
      }
      onSaved();
      onClose();
    } catch {
      setError('No se pudo guardar la categoría');
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
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
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
            <label className="block text-sm font-semibold text-muted" htmlFor="category-name">
              Nombre de la Categoría
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Entrantes, Postres, Bebidas"
              autoFocus
              className="w-full h-11 px-4 bg-white border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <p className="text-sm text-muted">{'Este nombre será visible para los clientes en el menú digital.'}</p>

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
            {isEdit ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </div>
      </div>
    </div>
  );
}