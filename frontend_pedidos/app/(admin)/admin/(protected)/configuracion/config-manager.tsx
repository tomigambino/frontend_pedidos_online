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
import { IncompleteConfigBanner } from '@/components/admin/incomplete-config-banner';
import { ScheduleSection } from './schedule-section';
import { ExceptionsSection } from './exceptions-section';

const inputBase =
  'w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-60 disabled:cursor-not-allowed';
const inputClass = `${inputBase} border-black/15`;
const inputMissingClass = `${inputBase} border-amber-400`;

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

const BANK_FIELDS = ['cbu', 'alias', 'accountHolder', 'bank'] as const;

type SectionKey = 'general' | 'appearance' | 'banking' | 'delivery';

const SECTION_FIELDS: Record<SectionKey, (keyof UpdateTenantDto)[]> = {
  general: ['name', 'whatsapp', 'description', 'address'],
  appearance: ['logo', 'banner', 'primaryColor', 'secondaryColor'],
  banking: ['bank', 'cbu', 'alias', 'accountHolder'],
  delivery: ['deliveryCostEnabled', 'deliveryCost'],
};

const SECTIONS = [
  { id: 'general', label: 'Información General', icon: 'badge' },
  { id: 'apariencia', label: 'Apariencia', icon: 'palette' },
  { id: 'bancarios', label: 'Datos Bancarios', icon: 'account_balance' },
  { id: 'delivery', label: 'Delivery', icon: 'delivery_dining' },
  { id: 'horarios', label: 'Horarios de Atención', icon: 'schedule' },
  { id: 'excepciones', label: 'Excepciones', icon: 'event_busy' },
];

type SectionProps = {
  id: string;
  form: Partial<UpdateTenantDto>;
  updateField: UpdateField;
  editing: boolean;
  sectionKey: SectionKey;
  editingSection: SectionKey | null;
  onEdit: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
};

function getMissingSections(form: Partial<UpdateTenantDto>): string[] {
  const sections: string[] = [];

  const generalMissing = !form.description || !form.whatsapp || !form.address;
  if (generalMissing) sections.push('Información General');

  const appearanceMissing = !form.logo || !form.primaryColor || !form.secondaryColor;
  if (appearanceMissing) sections.push('Apariencia');

  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  if (bankFilled.length < BANK_FIELDS.length) sections.push('Datos Bancarios');

  return sections;
}

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
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

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
  }

  async function handleSave(): Promise<boolean> {
    if (bankPartial) {
      show('Completá los 4 datos bancarios o dejalos todos vacíos.', 'error');
      return false;
    }
    setSaving(true);
    try {
      await updateTenant(tenantSlug, form);
      show('Cambios guardados');
      return true;
    } catch {
      show('No se pudo guardar', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSection() {
    const ok = await handleSave();
    if (ok) setEditingSection(null);
  }

  function handleCancelSection(sectionKey: SectionKey) {
    if (!config) return;
    const original = toForm(config);
    setForm((prev) => {
      const reverted = { ...prev };
      for (const field of SECTION_FIELDS[sectionKey]) {
        (reverted as Record<string, unknown>)[field] = (original as Record<string, unknown>)[field];
      }
      return reverted;
    });
    setEditingSection(null);
  }

  function handleSectionClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
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

  const missingSections = getMissingSections(form);
  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  const bankPartial = bankFilled.length > 0 && bankFilled.length < BANK_FIELDS.length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-24">
      <IncompleteConfigBanner missingSections={missingSections} />
      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Configuración del Negocio
        </h1>
        <p className="text-muted">
          Administra la identidad, canales de contacto y costos de tu establecimiento.
        </p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSectionClick(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-black/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          <GeneralInfo
            id="general"
            form={form}
            updateField={updateField}
            editing={editingSection === 'general'}
            sectionKey="general"
            editingSection={editingSection}
            onEdit={() => setEditingSection('general')}
            onCancel={() => handleCancelSection('general')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <Appearance
            id="apariencia"
            form={form}
            updateField={updateField}
            editing={editingSection === 'appearance'}
            sectionKey="appearance"
            editingSection={editingSection}
            onEdit={() => setEditingSection('appearance')}
            onCancel={() => handleCancelSection('appearance')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <BankingDetails
            id="bancarios"
            form={form}
            updateField={updateField}
            editing={editingSection === 'banking'}
            sectionKey="banking"
            editingSection={editingSection}
            onEdit={() => setEditingSection('banking')}
            onCancel={() => handleCancelSection('banking')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <Delivery
            id="delivery"
            form={form}
            updateField={updateField}
            editing={editingSection === 'delivery'}
            sectionKey="delivery"
            editingSection={editingSection}
            onEdit={() => setEditingSection('delivery')}
            onCancel={() => handleCancelSection('delivery')}
            onConfirm={handleConfirmSection}
            saving={saving}
          />
          <section id="horarios" className="scroll-mt-24">
            <ScheduleSection
              slug={tenantSlug}
              isOpen={form.isOpen ?? true}
              onToggleOpen={handleToggleOpen}
            />
          </section>
          <section id="excepciones" className="scroll-mt-24">
            <ExceptionsSection slug={tenantSlug} />
          </section>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  sectionKey,
  editingSection,
  onEdit,
}: {
  icon: string;
  title: string;
  sectionKey: SectionKey;
  editingSection: SectionKey | null;
  onEdit: () => void;
}) {
  const isEditing = editingSection === sectionKey;
  return (
    <div className="flex items-center justify-between mb-5 border-b border-black/10 pb-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {!isEditing && (
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-semibold text-muted hover:text-primary flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Editar
        </button>
      )}
    </div>
  );
}

function SectionActions({
  onCancel,
  onConfirm,
  saving,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-black/5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-5 py-2 rounded-lg border border-black/15 text-muted font-semibold hover:bg-black/5 transition-all disabled:opacity-40"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={saving}
        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-40"
      >
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
}

function GeneralInfo({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="badge"
        title="Información General"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Nombre del Negocio</label>
          <input
            className={inputClass}
            type="text"
            value={form.name ?? ''}
            disabled={!editing}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>WhatsApp de Pedidos</label>
          <input
            className={form.whatsapp ? inputClass : inputMissingClass}
            type="tel"
            value={form.whatsapp ?? ''}
            placeholder="5491112345678"
            disabled={!editing}
            onChange={(e) => updateField('whatsapp', e.target.value)}
          />
          <p className="text-xs text-muted">
            Sin +54 fijo. Ejemplo: <span className="font-mono">5491112345678</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Descripción Corta</label>
          <textarea
            className={`${form.description ? inputClass : inputMissingClass} min-h-[70px] resize-none`}
            rows={2}
            value={form.description ?? ''}
            disabled={!editing}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className={labelClass}>Dirección del Local</label>
          <div className="relative">
            <input
              className={`${form.address ? inputClass : inputMissingClass} pr-12`}
              type="text"
              value={form.address ?? ''}
              placeholder="Ej: Av. Corrientes 1234, CABA"
              disabled={!editing}
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
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function Appearance({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="palette"
        title="Apariencia"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="flex flex-wrap items-start gap-8">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Logo del Negocio</label>
          <div
            className={`w-32 h-32 rounded-2xl bg-black/5 border-2 border-dashed ${form.logo ? 'border-black/15' : 'border-amber-400'} flex items-center justify-center`}
          >
            <span className="material-symbols-outlined text-muted text-3xl">storefront</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Banner del Negocio</label>
          <div
            className={`w-64 h-32 rounded-2xl bg-black/5 border-2 border-dashed ${form.banner ? 'border-black/15' : 'border-amber-400'} flex flex-col items-center justify-center gap-1 text-muted`}
          >
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
                value={/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor ?? '') ? form.primaryColor ?? '#ea580c' : '#ea580c'}
                disabled={!editing}
                onChange={(e) => updateField('primaryColor', e.target.value)}
              />
              <input
                className={`${form.primaryColor ? inputClass : inputMissingClass} font-mono`}
                type="text"
                value={form.primaryColor ?? ''}
                placeholder="#EA580C"
                disabled={!editing}
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
                value={/^#[0-9A-Fa-f]{6}$/.test(form.secondaryColor ?? '') ? form.secondaryColor ?? '#1e293b' : '#1e293b'}
                disabled={!editing}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
              <input
                className={`${form.secondaryColor ? inputClass : inputMissingClass} font-mono`}
                type="text"
                value={form.secondaryColor ?? ''}
                placeholder="#1E293B"
                disabled={!editing}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function BankingDetails({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  const bankFilled = BANK_FIELDS.filter((k) => form[k]);
  const bankPartial = bankFilled.length > 0 && bankFilled.length < BANK_FIELDS.length;
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="account_balance"
        title="Datos Bancarios"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <p className="text-sm text-gray-500 mt-2 mb-5 flex items-start gap-1">
        <span className="material-symbols-outlined text-base">info</span>
        Estos datos se mostrarán al cliente cuando elija &quot;Transferencia&quot; como método de pago.
      </p>
      {editing && bankPartial && (
        <p className="text-xs text-red-600 mb-5 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          Completá los 4 datos bancarios o dejalos todos vacíos.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Entidad / Banco</label>
          <input
            className={form.bank ? inputClass : inputMissingClass}
            type="text"
            value={form.bank ?? ''}
            placeholder="Ej: Banco Nación"
            disabled={!editing}
            onChange={(e) => updateField('bank', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>CBU</label>
          <input
            className={form.cbu ? inputClass : inputMissingClass}
            type="text"
            value={form.cbu ?? ''}
            placeholder="22 dígitos"
            disabled={!editing}
            onChange={(e) => updateField('cbu', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Alias</label>
          <input
            className={form.alias ? inputClass : inputMissingClass}
            type="text"
            value={form.alias ?? ''}
            placeholder="Ej: mi.negocio.pago"
            disabled={!editing}
            onChange={(e) => updateField('alias', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Titular</label>
          <input
            className={form.accountHolder ? inputClass : inputMissingClass}
            type="text"
            value={form.accountHolder ?? ''}
            placeholder="Nombre completo del titular"
            disabled={!editing}
            onChange={(e) => updateField('accountHolder', e.target.value)}
          />
        </div>
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}

function Delivery({
  id,
  form,
  updateField,
  editing,
  sectionKey,
  editingSection,
  onEdit,
  onCancel,
  onConfirm,
  saving,
}: SectionProps) {
  const enabled = form.deliveryCostEnabled ?? false;
  return (
    <section id={id} className="bg-white rounded-xl border border-black/5 shadow-sm p-6 scroll-mt-24">
      <SectionHeader
        icon="delivery_dining"
        title="Delivery"
        sectionKey={sectionKey}
        editingSection={editingSection}
        onEdit={onEdit}
      />
      <div className="flex flex-wrap items-center justify-between gap-6 p-4 rounded-xl bg-black/5">
        <div className="flex items-center gap-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              disabled={!editing}
              onChange={(e) => updateField('deliveryCostEnabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-disabled:opacity-60 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
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
              disabled={!editing}
              onChange={(e) =>
                updateField('deliveryCost', e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        )}
      </div>
      {editing && <SectionActions onCancel={onCancel} onConfirm={onConfirm} saving={saving} />}
    </section>
  );
}