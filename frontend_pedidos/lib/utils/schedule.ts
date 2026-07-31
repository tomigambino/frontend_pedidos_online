import type { ExceptionDto, RegularScheduleDto } from '@/lib/api/tenants';

export interface ScheduleSlot {
  openingTime: string;
  closingTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  label: string;
  isToday: boolean;
  isOpen: boolean;
  slots: ScheduleSlot[];
}

export const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export function getTodayDayOfWeek(): number {
  return (new Date().getDay() + 6) % 7 + 1;
}

function trimTime(time: string | null): string {
  return time ? time.slice(0, 5) : '';
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildWeekSchedule(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
): DaySchedule[] {
  const today = getTodayDayOfWeek();
  const todayKey = toDateKey(new Date());
  const todayException = exceptions.find((e) => e.date === todayKey);

  return Array.from({ length: 7 }, (_, i) => i + 1).map((dayOfWeek) => {
    // antes: regular.find(...) -> ahora TODAS las franjas del día
    const regularRows = regular.filter((r) => r.dayOfWeek === dayOfWeek);

    let isOpen = false;
    let slots: ScheduleSlot[] = [];

    if (todayException && dayOfWeek === today) {
      isOpen = todayException.isOpen;
      if (isOpen) {
        slots = [{
          openingTime: trimTime(todayException.openingTime),
          closingTime: trimTime(todayException.closingTime),
        }];
      }
    } else if (regularRows.length > 0) {
      isOpen = true;
      slots = regularRows.map((r) => ({
        openingTime: trimTime(r.openingTime),
        closingTime: trimTime(r.closingTime),
      }));
    }

    return {
      dayOfWeek,
      label: DAY_NAMES[dayOfWeek],
      isToday: dayOfWeek === today,
      isOpen,
      slots,
    };
  });
}