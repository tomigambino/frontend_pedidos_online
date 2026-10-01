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

export const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

const zonedDateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getZonedDateKey(date: Date = new Date()): string {
  const parts = zonedDateKeyFormatter.formatToParts(date);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getIsoDayOfWeek(date: Date = new Date()): number {
  const [year, month, day] = getZonedDateKey(date).split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7 + 1;
}

export function getTodayDayOfWeek(): number {
  return getIsoDayOfWeek();
}

function trimTime(time: string | null): string {
  return time ? time.slice(0, 5) : '';
}

export function getTodaySchedule(
  regular: RegularScheduleDto[],
): ScheduleSlot | null {
  const today = regular.find((r) => r.dayOfWeek === getTodayDayOfWeek());
  if (!today) return null;
  return {
    openingTime: trimTime(today.openingTime),
    closingTime: trimTime(today.closingTime),
  };
}

export function buildWeekSchedule(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
): DaySchedule[] {
  const today = getTodayDayOfWeek();
  const todayKey = getZonedDateKey();
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