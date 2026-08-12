'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createScheduleSlot,
  deleteScheduleSlot,
  getSchedule,
  updateScheduleSlot,
  type CreateScheduleDto,
  type RegularScheduleDto,
} from '@/lib/api/tenants';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { Toast, useToast } from '@/components/admin/Toast';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function trimTime(time: string): string {
  return time.slice(0, 5);
}

function TimeInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  function commit() {
    if (local !== value && local) onCommit(local);
  }

  return (
    <input
      type="time"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className="bg-white border border-black/15 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
    />
  );
}

interface ScheduleSectionProps {
  slug: string;
  isOpen: boolean;
  onToggleOpen: (value: boolean) => void;
}

export function ScheduleSection({ slug, isOpen, onToggleOpen }: ScheduleSectionProps) {
  const { toast, show } = useToast();
  const [slots, setSlots] = useState<RegularScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDay, setConfirmDay] = useState<number | null>(null);

  const loadSlots = useCallback(async () => {
    try {
      const data = await getSchedule(slug);
      setSlots(data);
    } catch {
      show('No se pudieron cargar los horarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [slug, show]);

  useEffect(() => {
    const timeout = setTimeout(loadSlots, 0);
    return () => clearTimeout(timeout);
  }, [loadSlots]);

  const slotsByDay = (dayOfWeek: number) =>
    slots.filter((s) => s.dayOfWeek === dayOfWeek).sort((a, b) =>
      a.openingTime.localeCompare(b.openingTime),
    );

  async function handleAddSlot(dayOfWeek: number) {
    try {
      const created = await createScheduleSlot(slug, {
        dayOfWeek,
        openingTime: '19:00',
        closingTime: '23:00',
      });
      setSlots((prev) => [...prev, created]);
      show('Franja horaria agregada');
    } catch {
      show('No se pudo agregar el horario', 'error');
    } finally {
      setConfirmDay(null);
    }
  }

  async function handleUpdateSlot(id: string, dto: Partial<CreateScheduleDto>) {
    try {
      const updated = await updateScheduleSlot(slug, id, dto);
      setSlots((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      show('No se pudo actualizar el horario', 'error');
    }
  }

  async function handleDeleteSlot(id: string) {
    try {
      await deleteScheduleSlot(slug, id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch {
      show('No se pudo eliminar el horario', 'error');
    }
  }

  return (
    <section className="bg-white rounded-xl border border-black/5 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5 border-b border-black/10 pb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">schedule</span>
          <h2 className="text-lg font-bold text-foreground">Horarios de Atención</h2>
        </div>
        <div className="flex items-center gap-4 bg-black/5 px-4 py-2 rounded-xl border border-black/10">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Estado del Local
            </span>
            <span className="text-[10px] text-muted leading-none">Sobreescribir horario</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isOpen ? 'text-status-open' : 'text-status-closed'}`}>
              {isOpen ? 'ABIERTO' : 'CERRADO'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isOpen}
                onChange={(e) => onToggleOpen(e.target.checked)}
              />
              <div
                className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-status-open after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white`}
              />
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-muted py-8 text-center">Cargando horarios…</div>
      ) : (
        <div className="space-y-3">
          {DIAS.map((dia, index) => {
            const dayOfWeek = index + 1;
            const daySlots = slotsByDay(dayOfWeek);
            return (
              <div
                key={dayOfWeek}
                className={`flex items-start justify-between gap-3 p-4 rounded-xl bg-black/5 ${
                  daySlots.length === 0 ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-[120px] pt-1">
                  <span className="font-semibold text-foreground">{dia}</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDay(dayOfWeek)}
                    className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title={`Agregar franja a ${dia}`}
                  >
                    <span className="material-symbols-outlined text-xl">add_circle</span>
                  </button>
                  {daySlots.length === 0 ? (
                    <span className="text-muted text-sm italic">Cerrado todo el día</span>
                  ) : (
                    daySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                        <TimeInput
                          key={`${slot.id}-${trimTime(slot.openingTime)}`}
                          value={trimTime(slot.openingTime)}
                          onCommit={(v) => handleUpdateSlot(slot.id, { openingTime: v })}
                        />
                        <span className="text-muted text-sm">a</span>
                        <TimeInput
                          key={`${slot.id}-${trimTime(slot.closingTime)}`}
                          value={trimTime(slot.closingTime)}
                          onCommit={(v) => handleUpdateSlot(slot.id, { closingTime: v })}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar franja"
                        >
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDay !== null && (
        <ConfirmModal
          title="Agregar franja horaria"
          message={`¿Agregar una franja de 19:00 a 23:00 para los ${DIAS[confirmDay - 1]}? Podrás editarla después.`}
          confirmLabel="Agregar"
          onConfirm={() => handleAddSlot(confirmDay)}
          onCancel={() => setConfirmDay(null)}
        />
      )}

      <Toast toast={toast} />
    </section>
  );
}
