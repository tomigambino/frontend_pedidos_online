'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createException,
  deleteException,
  getExceptions,
  type CreateExceptionDto,
  type ExceptionDto,
} from '@/lib/api/tenants';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Toast, useToast } from '@/components/admin/Toast';

const inputClass =
  'w-full px-4 py-3 bg-white border border-black/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

const labelClass = 'text-sm font-semibold text-muted';

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface ExceptionsSectionProps {
  slug: string;
}

export function ExceptionsSection({ slug }: ExceptionsSectionProps) {
  const { toast, show } = useToast();
  const [exceptions, setExceptions] = useState<ExceptionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ExceptionDto | null>(null);

  const loadExceptions = useCallback(async () => {
    try {
      const data = await getExceptions(slug);
      setExceptions(data);
    } catch {
      show('No se pudieron cargar las excepciones', 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, show]);

  useEffect(() => {
    const timeout = setTimeout(loadExceptions, 0);
    return () => clearTimeout(timeout);
  }, [loadExceptions]);

  async function handleCreate(dto: CreateExceptionDto) {
    try {
      await createException(slug, dto);
      show('Excepción agregada');
      setShowForm(false);
      loadExceptions();
    } catch {
      show('No se pudo agregar', 'error');
    }
  }

  async function executeDelete() {
    if (!confirmTarget) return;
    try {
      await deleteException(slug, confirmTarget.id);
      show('Excepción eliminada');
      loadExceptions();
    } catch {
      show('No se pudo eliminar', 'error');
    } finally {
      setConfirmTarget(null);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 border-b border-black/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">event_busy</span>
          <h2 className="text-lg font-bold text-foreground">
            Excepciones (Cierres o Aperturas Especiales)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-primary font-bold flex items-center gap-1 hover:underline text-sm"
        >
          <span className="material-symbols-outlined">add</span> Agregar
        </button>
      </div>

      {loading ? (
        <div className="text-muted py-8 text-center">Cargando excepciones…</div>
      ) : exceptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="material-symbols-outlined text-4xl text-muted mb-3">event_available</span>
          <p className="text-muted text-sm">Sin excepciones. Agregá cierres o aperturas especiales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between p-4 rounded-xl border border-black/10 bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">
                    {ex.reason || (ex.isOpen ? 'Apertura especial' : 'Cierre especial')}
                  </p>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      ex.isOpen ? 'bg-status-open/10 text-status-open' : 'bg-status-closed/10 text-status-closed'
                    }`}
                  >
                    {ex.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {formatDate(ex.date)}
                  {ex.isOpen && ex.openingTime && ex.closingTime
                    ? ` · ${ex.openingTime.slice(0, 5)} a ${ex.closingTime.slice(0, 5)}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTarget(ex)}
                className="p-2 text-red-600 hover:bg-red-500/10 rounded-full transition-colors"
                title="Eliminar excepción"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExceptionForm
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {confirmTarget && (
        <ConfirmModal
          title="Eliminar excepción"
          message={`¿Eliminar la excepción del ${formatDate(confirmTarget.date)}? Esta acción no se puede deshacer.`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <Toast toast={toast} />
    </section>
  );
}

function ExceptionForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (dto: CreateExceptionDto) => void;
}) {
  const [date, setDate] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');

  const canSubmit = date !== '' && (!isOpen || (openingTime !== '' && closingTime !== ''));

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      date,
      isOpen,
      reason: reason.trim() || null,
      openingTime: isOpen ? openingTime : null,
      closingTime: isOpen ? closingTime : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Nueva excepción</h3>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Fecha</label>
          <input
            className={inputClass}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/5">
          <div>
            <p className="text-sm font-semibold text-foreground">¿El local abre?</p>
            <p className="text-xs text-muted">Si no, se considerará cerrado ese día</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-status-open after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
        </div>

        {isOpen ? (
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-2 flex-1">
              <label className={labelClass}>Apertura</label>
              <input
                className={inputClass}
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
              />
            </div>
            <span className="text-muted text-sm pb-3">a</span>
            <div className="flex flex-col gap-2 flex-1">
              <label className={labelClass}>Cierre</label>
              <input
                className={inputClass}
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Motivo (opcional)</label>
          <input
            className={inputClass}
            type="text"
            value={reason}
            placeholder="Ej: Feriado, mantenimiento…"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 border border-black/15 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 h-11 bg-primary rounded-lg text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}