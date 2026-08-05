'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import {
  activateProduct,
  deleteProduct,
  getProductsAdmin,
  hideProduct,
  type ProductResponseDto,
} from '@/lib/api/products';
import {
  activateCategory,
  deleteCategory,
  getCategoriesAdmin,
  hideCategory,
  type CategoryResponseDto,
} from '@/lib/api/categories';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { Toast, useToast } from '@/components/admin/Toast';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

type Tab = 'productos' | 'categorias';

const PAGE_SIZE = 100;

export function MenuManager() {
  const { tenantSlug } = useAdminSession();
  const { toast, show } = useToast();

  const [tab, setTab] = useState<Tab>('productos');
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponseDto | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponseDto | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'product' | 'category';
    id: string;
    name: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'productos') {
        const res = await getProductsAdmin(tenantSlug, page, PAGE_SIZE);
        setProducts(res.data);
        setTotalPages(res.totalPages);
        setTotalItems(res.total);
      } else {
        const res = await getCategoriesAdmin(tenantSlug, page, PAGE_SIZE);
        setCategories(res.data);
        setTotalPages(res.totalPages);
        setTotalItems(res.total);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, tab, page]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 0);
    return () => clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    let active = true;
    getCategoriesAdmin(tenantSlug, 1, 100)
      .then((res) => {
        if (active) setCategories(res.data);
      })
      .catch(() => {
        // sin categorías cargadas
      });
    return () => {
      active = false;
    };
  }, [tenantSlug]);

  const activeProducts = products.filter((p) => p.isActive).length;
  const hiddenProducts = products.length - activeProducts;

  async function handleToggleProduct(id: string, currentlyActive: boolean) {
    try {
      const updated = currentlyActive
        ? await hideProduct(tenantSlug, id)
        : await activateProduct(tenantSlug, id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      show(currentlyActive ? 'Producto ocultado' : 'Producto activado');
    } catch {
      show('No se pudo actualizar el producto', 'error');
    }
  }

  async function handleToggleCategory(id: string, currentlyActive: boolean) {
    try {
      const updated = currentlyActive
        ? await hideCategory(tenantSlug, id)
        : await activateCategory(tenantSlug, id);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      show(currentlyActive ? 'Categoría ocultada' : 'Categoría activada');
    } catch {
      show('No se pudo actualizar la categoría', 'error');
    }
  }

  async function handleDeleteProduct(product: ProductResponseDto) {
    setConfirmTarget({ type: 'product', id: product.id, name: product.name });
  }

  async function handleDeleteCategory(category: CategoryResponseDto) {
    setConfirmTarget({ type: 'category', id: category.id, name: category.name });
  }

  async function executeDelete() {
    if (!confirmTarget) return;
    try {
      if (confirmTarget.type === 'product') {
        await deleteProduct(tenantSlug, confirmTarget.id);
        show('Producto eliminado');
      } else {
        await deleteCategory(tenantSlug, confirmTarget.id);
        show('Categoría eliminada');
      }
      await loadData();
    } catch {
      show('No se pudo eliminar', 'error');
    } finally {
      setConfirmTarget(null);
    }
  }

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: ProductResponseDto) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: CategoryResponseDto) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const stats = [
    {
      label: tab === 'productos' ? 'Total Productos' : 'Total Categorías',
      value: totalItems,
    },
    {
      label: tab === 'productos' ? 'Activos' : 'Activas',
      value: tab === 'productos' ? activeProducts : categories.filter((c) => c.isActive).length,
      className: 'text-status-open',
    },
    {
      label: tab === 'productos' ? 'Ocultos' : 'Ocultas',
      value: tab === 'productos' ? hiddenProducts : categories.filter((c) => !c.isActive).length,
      className: 'text-muted',
    },
  ];

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(normalizedSearch) &&
      (categoryFilter === '' || p.categoryId === categoryFilter),
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(normalizedSearch),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Gestión de Menú</h1>
          <p className="text-muted">Organiza tus productos, precios y disponibilidad en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-black/5 p-1.5 rounded-xl border border-black/10 w-fit">
            {(['productos', 'categorias'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {t === 'productos' ? 'Productos' : 'Categorías'}
              </button>
            ))}
          </div>
          {tab === 'productos' && (
            <button
              type="button"
              onClick={openCreate}
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl shadow text-sm font-semibold transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Nuevo Producto
            </button>
          )}
          {tab === 'categorias' && (
            <button
              type="button"
              onClick={openCreateCategory}
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl shadow text-sm font-semibold transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Nueva Categoría
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-xl border border-black/5 shadow-sm">
            <p className="text-xs font-semibold tracking-wider text-muted mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.className ?? 'text-foreground'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tab === 'productos' ? 'Buscar producto por nombre...' : 'Buscar categoría por nombre...'}
            className="w-full pl-10 pr-4 py-3 bg-white border border-black/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {tab === 'productos' && (
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto h-12 pl-4 pr-10 appearance-none bg-white border border-black/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-shadow"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
              <span className="material-symbols-outlined text-xl">expand_more</span>
            </div>
          </div>
        )}
      </div>

      {searchTerm.trim() !== '' || categoryFilter !== '' ? (
        <p className="text-sm text-muted mb-6">
          {(tab === 'productos' ? filteredProducts.length : filteredCategories.length)}
          {' '}
          resultado
          {(tab === 'productos' ? filteredProducts.length : filteredCategories.length) !== 1
            ? 's'
            : ''}
        </p>
      ) : null}

      {loading ? (
        <div className="text-muted py-12 text-center">Cargando…</div>
      ) : tab === 'productos' ? (
        <ProductsSection
          products={filteredProducts}
          page={page}
          totalPages={totalPages}
          onToggle={handleToggleProduct}
          onDelete={handleDeleteProduct}
          onEdit={openEdit}
          onPageChange={setPage}
        />
      ) : (
        <CategoriesSection
          categories={filteredCategories}
          page={page}
          totalPages={totalPages}
          onToggle={handleToggleCategory}
          onDelete={handleDeleteCategory}
          onEdit={openEditCategory}
          onPageChange={setPage}
        />
      )}

      {modalOpen && (
        <ProductFormModal
          slug={tenantSlug}
          categories={categories}
          product={editingProduct ?? undefined}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            show(editingProduct ? 'Producto actualizado' : 'Producto creado');
            loadData();
          }}
        />
      )}

      {categoryModalOpen && (
        <CategoryFormModal
          slug={tenantSlug}
          category={editingCategory ?? undefined}
          onClose={() => setCategoryModalOpen(false)}
          onSaved={() => {
            show(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
            loadData();
          }}
        />
      )}

      <Toast toast={toast} />

      {confirmTarget && (
        <ConfirmModal
          title="Eliminar"
          message={`¿Eliminar "${confirmTarget.name}"? Esta acción no se puede deshacer.`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {tab === 'productos' && (
        <button
          type="button"
          onClick={openCreate}
          className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 transition-transform"
          aria-label="Nuevo Producto"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}
      {tab === 'categorias' && (
        <button
          type="button"
          onClick={openCreateCategory}
          className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-lg active:scale-95 transition-transform"
          aria-label="Nueva Categoría"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}
    </div>
  );
}

function ProductsSection({
  products,
  page,
  totalPages,
  onToggle,
  onDelete,
  onEdit,
  onPageChange,
}: {
  products: ProductResponseDto[];
  page: number;
  totalPages: number;
  onToggle: (id: string, currentlyActive: boolean) => void;
  onDelete: (product: ProductResponseDto) => void;
  onEdit: (product: ProductResponseDto) => void;
  onPageChange: (page: number) => void;
}) {
  if (products.length === 0) {
    return <EmptyState />;
  }
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden flex flex-col ${
              p.isActive ? '' : 'opacity-75'
            }`}
          >
            <div className="relative h-48 w-full bg-gray-100">
              {p.imageUrl ? (
                <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl text-muted">restaurant</span>
                </div>
              )}
              {!p.isActive && (
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                  <span className="bg-white/90 text-foreground px-4 py-2 rounded-lg font-bold shadow-sm">
                    No Disponible
                  </span>
                </div>
              )}
            </div>
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-2 gap-3">
                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <span className="font-extrabold text-lg text-primary whitespace-nowrap">
                  ${p.price.toFixed(2)}
                </span>
              </div>
              {p.description && (
                <p className="text-muted text-sm line-clamp-2 mb-6">{p.description}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted">
                    {p.isActive ? 'Disponible' : 'Oculto'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={p.isActive}
                      onChange={() => onToggle(p.id, p.isActive)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="p-2 text-muted hover:bg-black/5 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}

function CategoriesSection({
  categories,
  page,
  totalPages,
  onToggle,
  onDelete,
  onEdit,
  onPageChange,
}: {
  categories: CategoryResponseDto[];
  page: number;
  totalPages: number;
  onToggle: (id: string, currentlyActive: boolean) => void;
  onDelete: (category: CategoryResponseDto) => void;
  onEdit: (category: CategoryResponseDto) => void;
  onPageChange: (page: number) => void;
}) {
  if (categories.length === 0) {
    return <EmptyState />;
  }
  return (
    <>
      <div className="grid grid-cols-1 sm:hidden gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-xl border border-black/5 shadow-sm p-4 ${
              c.isActive ? '' : 'opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2 gap-3">
              <h3 className="font-bold text-foreground">{c.name}</h3>
              <span className="text-xs font-semibold">
                {c.isActive ? (
                  <span className="text-status-open">Activa</span>
                ) : (
                  <span className="text-muted">Oculta</span>
                )}
              </span>
            </div>
            <p className="text-sm text-muted mb-3">{c.productCount} producto(s)</p>
            <div className="flex items-center justify-between pt-3 border-t border-black/5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted">
                  {c.isActive ? 'Visible' : 'Oculto'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={c.isActive}
                    onChange={() => onToggle(c.id, c.isActive)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </label>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  className="p-2 text-muted hover:bg-black/5 rounded-lg transition-colors"
                  title="Editar"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c)}
                  className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/5 text-xs font-semibold text-muted uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Nombre</th>
              <th className="px-5 py-3">Productos</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {categories.map((c) => (
              <tr key={c.id} className={c.isActive ? '' : 'opacity-60'}>
                <td className="px-5 py-4 font-semibold text-foreground">{c.name}</td>
                <td className="px-5 py-4 text-muted">{c.productCount}</td>
                <td className="px-5 py-4">
                  <span className="text-xs font-semibold">
                    {c.isActive ? (
                      <span className="text-status-open">Activa</span>
                    ) : (
                      <span className="text-muted">Oculta</span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={c.isActive}
                        onChange={() => onToggle(c.id, c.isActive)}
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="p-2 text-muted hover:bg-black/5 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded-lg border border-black/10 text-sm disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-sm text-muted">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded-lg border border-black/10 text-sm disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-5xl text-muted mb-4">search_off</span>
      <p className="text-lg font-semibold text-foreground mb-1">No se encontraron resultados</p>
      <p className="text-muted text-sm">Prueba con otra búsqueda o filtro.</p>
    </div>
  );
}