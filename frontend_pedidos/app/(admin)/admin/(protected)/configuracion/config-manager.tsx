'use client';

import { useEffect, useState } from 'react';
import { useAdminSession } from '@/components/admin/AdminSessionProvider';
import {
  getTenantConfig,
  updateTenant,
  type TenantConfigResponseDto,
  type UpdateTenantDto,
} from '@/lib/api/tenants';
import { Toast, useToast } from '@/components/admin/Toast';
import { ScheduleSection } from './schedule-section';
import { ExceptionsSection } from './exceptions-section';

const inputClass =
  'w-full px-4 py-3 bg-white border border-black/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

const labelClass = 'text-sm font-semibold text-muted';

type UpdateField = <K extends keyof UpdateTenantDto>(key: K, value: UpdateTenantDto[K]) => void;

const FORM_KEYS: (keyof UpdateTenantDto)[] = [
  'name',
  'logo',
  'banner',
  'primaryColor',
  'secondaryColor',
  'description',
  'whatsapp',
  'address',
  'cbu',
  'alias',
  'accountHolder',
  'bank',
  'isOpen',
  'deliveryCostEnabled',
  'deliveryCost',
];

function toForm(data: TenantConfigResponseDto): Partial<UpdateTenantDto> {
  const form: Partial<UpdateTenantDto> = {};
  for (const key of FORM_KEYS) {
    const value = (data as unknown as Record<string, unknown>)[key];
    if (value !== undefined) {
      (form as Record<string, unknown>)[key] = value;
    }
  }
  return form;
}

export function ConfigManager() {
  const { tenantSlug } = useAdminSession();
  const { toast, show } = useToast();

  const [config, setConfig] = useState<TenantConfigResponseDto | null>(null);
  const [form, setForm] = useState<Partial<UpdateTenantDto>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getTenantConfig(tenantSlug)
      .then((data) => {
        if (!active) return;
        setConfig(data);
        setForm(toForm(data));
      })
      .catch(() => {
        if (active) show('No se pudo cargar la configuración', 'error');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug]);

  function updateField<K extends keyof UpdateTenantDto>(key: K, value: UpdateTenantDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateTenant(tenantSlug, form);
      show('Cambios guardados');
      setDirty(false);
    } catch {
      show('No se pudo guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (!config) return;
    setForm(toForm(config));
    setDirty(false);
  }

  async function handleToggleOpen(value: boolean) {
    setForm((prev) => ({ ...prev, isOpen: value }));
    try {
      await updateTenant(tenantSlug, { isOpen: value });
      show(value ? 'Local abierto' : 'Local cerrado');
    } catch {
      show('No se pudo actualizar el estado', 'error');
      setForm((prev) => ({ ...prev, isOpen: !value }));
    }
  }

  if (!config) {
    return <div className="text-muted py-12 text-center">Cargando configuración…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Configuración del Negocio
        </h1>
        <p className="text-muted">
          Administra la identidad, canales de contacto y costos de tu establecimiento.
        </p>
      </div>

      <div className="space-y-6">
        <GeneralInfo form={form} updateField={updateField} />
        <Appearance form={form} updateField={updateField} />
        <BankingDetails form={form} updateField={updateField} />
        <Delivery form={form} updateField={updateField} />
        <ScheduleSection
          slug={tenantSlug}
          isOpen={form.isOpen ?? true}
          onToggleOpen={handleToggleOpen}
        />
        <ExceptionsSection slug={tenantSlug} />
      </div>

      {dirty && (
        <div className="fixed bottom-14 md:bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-black/10 z-[60] py-4 px-4 md:px-12 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="hidden md:block">
            <p className="text-sm font-medium text-muted">Tienes cambios sin guardar</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={saving}
              className="flex-1 md:flex-none md:px-8 py-3 rounded-xl border-2 border-black/15 text-muted font-bold hover:bg-black/5 transition-all active:scale-95 disabled:opacity-40"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 md:flex-none md:px-12 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg transition-all active:scale-95 disabled:opacity-40"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5 border-b border-black/10 pb-4">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function GeneralInfo({
  form,
  updateField,
}: {
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
}) {
  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <SectionHeader icon="badge" title="Información General" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nombre del Negocio</label>
          <input
            className={inputClass}
            type="text"
            value={form.name ?? ''}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>WhatsApp de Pedidos</label>
          <input
            className={inputClass}
            type="tel"
            value={form.whatsapp ?? ''}
            placeholder="5491112345678"
            onChange={(e) => updateField('whatsapp', e.target.value)}
          />
          <p className="text-xs text-muted">
            Sin +54 fijo. Ejemplo: <span className="font-mono">5491112345678</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Descripción Corta</label>
          <textarea
            className={`${inputClass} min-h-[70px] resize-none`}
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Dirección del Local</label>
          <div className="relative">
            <input
              className={inputClass + ' pr-12'}
              type="text"
              value={form.address ?? ''}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              onChange={(e) => updateField('address', e.target.value)}
            />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver dirección en Google Maps"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">location_on</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Appearance({
  form,
  updateField,
}: {
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
}) {
  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <SectionHeader icon="palette" title="Apariencia" />
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Logo del Negocio</label>
          <div className="w-32 h-32 rounded-2xl bg-black/5 border-2 border-dashed border-black/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-muted text-3xl">storefront</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Banner del Negocio</label>
          <div className="w-64 h-32 rounded-2xl bg-black/5 border-2 border-dashed border-black/15 flex flex-col items-center justify-center gap-1 text-muted">
            <span className="material-symbols-outlined text-2xl">image</span>
            <span className="text-xs font-medium">Subir Banner</span>
          </div>
        </div>
        <div className="flex-1 space-y-6 min-w-[280px]">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Color Primario de la Marca</label>
            <div className="flex items-center gap-3">
              <input
                className="h-12 w-12 cursor-pointer rounded-full border-2 border-white shadow-md p-0 overflow-hidden appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor ?? '') ? form.primaryColor : '#ea580c'}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
              <input
                className={`${inputClass} font-mono`}
                type="text"
                value={form.primaryColor ?? ''}
                placeholder="#EA580C"
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Color Secundario de la Marca</label>
            <div className="flex items-center gap-3">
              <input
                className="h-12 w-12 cursor-pointer rounded-full border-2 border-white shadow-md p-0 overflow-hidden appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(form.secondaryColor ?? '') ? form.secondaryColor : '#1e293b'}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
              <input
                className={`${inputClass} font-mono`}
                type="text"
                value={form.secondaryColor ?? ''}
                placeholder="#1E293B"
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BankingDetails({
  form,
  updateField,
}: {
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
}) {
  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <SectionHeader icon="account_balance" title="Datos Bancarios" />
      <p className="text-sm text-gray-500 mt-2 mb-5 flex items-start gap-1">
        <span className="material-symbols-outlined text-base">info</span>
        Estos datos se mostrarán al cliente cuando elija &quot;Transferencia&quot; como método de pago.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Entidad / Banco</label>
          <input
            className={inputClass}
            type="text"
            value={form.bank ?? ''}
            placeholder="Ej: Banco Nación"
            onChange={(e) => updateField('bank', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>CBU</label>
          <input
            className={inputClass}
            type="text"
            value={form.cbu ?? ''}
            placeholder="22 dígitos"
            onChange={(e) => updateField('cbu', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Alias</label>
          <input
            className={inputClass}
            type="text"
            value={form.alias ?? ''}
            placeholder="Ej: mi.negocio.pago"
            onChange={(e) => updateField('alias', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Titular</label>
          <input
            className={inputClass}
            type="text"
            value={form.accountHolder ?? ''}
            placeholder="Nombre completo del titular"
            onChange={(e) => updateField('accountHolder', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

function Delivery({
  form,
  updateField,
}: {
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
}) {
  const enabled = form.deliveryCostEnabled ?? false;
  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <SectionHeader icon="delivery_dining" title="Delivery" />
      <div className="flex flex-wrap items-center justify-between gap-6 p-4 rounded-xl bg-black/5">
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={(e) => updateField('deliveryCostEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
          <span className="font-semibold text-foreground">Habilitar costo fijo de Delivery</span>
        </div>
        {enabled && (
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <label className={labelClass + ' whitespace-nowrap'}>Costo de Envío</label>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
              value={form.deliveryCost === null || form.deliveryCost === undefined ? '' : form.deliveryCost}
              placeholder="$ 0.00"
              onChange={(e) =>
                updateField('deliveryCost', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}