import type { ExceptionDto, RegularScheduleDto } from '@/lib/api/tenants';

export interface ScheduleSlot {
  openingTime: string;
  closingTime: string;
  closesNextDay: boolean;
}

export interface DaySchedule {
  dayOfWeek: number;
  label: string;
  isToday: boolean;
  isOpen: boolean;
  slots: ScheduleSlot[];
}

interface RawScheduleSlot {
  openingTime: string;
  closingTime: string;
  maxOrderTime: string | null;
  closesNextDay: boolean;
}

interface TargetShiftInternal {
  openingTime: string;
  closingTime: string;
  closesNextDay: boolean;
  startTimeline: number;
  maxOrderTimeline: number;
}

export function formatSlot(slot: ScheduleSlot): string {
  const openingTime = slot.openingTime.slice(0, 5);
  const closingTime = slot.closingTime.slice(0, 5);
  return `${openingTime} – ${closingTime}${slot.closesNextDay ? ' (+1)' : ''}`;
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

const AR_OFFSET_MIN = -180;

const zonedDateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const zonedTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function getZonedDateKey(date: Date = new Date()): string {
  const parts = zonedDateKeyFormatter.formatToParts(date);
  const part = (type: 'year' | 'month' | 'day') =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function getZonedTimeMinutes(date: Date): number {
  const parts = zonedTimeFormatter.formatToParts(date);
  const part = (type: 'hour' | 'minute') =>
    Number(parts.find((p) => p.type === type)?.value ?? '0');
  return part('hour') * 60 + part('minute');
}

// Date.UTC + getUTCDay() es UTC puro: no depende de la zona del dispositivo.
export function getIsoDayOfWeek(date: Date = new Date()): number {
  const [year, month, day] = getZonedDateKey(date).split('-').map(Number);
  return ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
}

export function getTodayDayOfWeek(): number {
  return getIsoDayOfWeek();
}

function getIsoDayOfWeekFromKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + deltaDays))
    .toISOString()
    .slice(0, 10);
}

function parseHHmmToMinutes(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function trimTime(time: string | null): string {
  return time ? time.slice(0, 5) : '';
}

function closesNextDayFrom(openingTime: string, closingTime: string): boolean {
  return parseHHmmToMinutes(closingTime) < parseHHmmToMinutes(openingTime);
}

function computeMaxOrderExtended(
  openingMinutes: number,
  closingExtendedMinutes: number,
  minimumDeliveryTime: number,
  maxOrderTime: string | null,
): number {
  if (maxOrderTime) {
    const parsed = parseHHmmToMinutes(maxOrderTime);
    return parsed < openingMinutes ? parsed + 1440 : parsed;
  }
  return closingExtendedMinutes - minimumDeliveryTime;
}

// Argentina no aplica horario de verano: se asume offset fijo -03:00.
function arDateTimeToUtc(dateKey: string, minutesFromMidnight: number): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day) +
      (minutesFromMidnight - AR_OFFSET_MIN) * 60_000,
  );
}

function effectiveSlotsForDateKey(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
  dateKey: string,
): RawScheduleSlot[] {
  const dayExceptions = exceptions.filter((e) => e.date === dateKey);

  if (dayExceptions.length > 0) {
    return dayExceptions
      .filter((e) => e.isOpen && e.openingTime && e.closingTime)
      .map((e) => {
        const openingTime = trimTime(e.openingTime);
        const closingTime = trimTime(e.closingTime);
        return {
          openingTime,
          closingTime,
          maxOrderTime: e.maxOrderTime ? trimTime(e.maxOrderTime) : null,
          closesNextDay:
            e.closesNextDay ?? closesNextDayFrom(openingTime, closingTime),
        };
      })
      .sort(
        (a, b) =>
          parseHHmmToMinutes(a.openingTime) -
          parseHHmmToMinutes(b.openingTime),
      );
  }

  const dayOfWeek = getIsoDayOfWeekFromKey(dateKey);

  return regular
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .map((r) => {
      const openingTime = trimTime(r.openingTime);
      const closingTime = trimTime(r.closingTime);
      return {
        openingTime,
        closingTime,
        maxOrderTime: r.maxOrderTime ? trimTime(r.maxOrderTime) : null,
        closesNextDay:
          r.closesNextDay ?? closesNextDayFrom(openingTime, closingTime),
      };
    })
    .sort(
      (a, b) =>
        parseHHmmToMinutes(a.openingTime) - parseHHmmToMinutes(b.openingTime),
    );
}

export function getEffectiveDaySchedule(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
  dateKey: string,
): { isOpen: boolean; slots: ScheduleSlot[] } {
  const slots = effectiveSlotsForDateKey(regular, exceptions, dateKey).map(
    (slot) => ({
      openingTime: slot.openingTime,
      closingTime: slot.closingTime,
      closesNextDay: slot.closesNextDay,
    }),
  );

  return { isOpen: slots.length > 0, slots };
}

export function getTargetShift(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
  minimumDeliveryTime: number,
  now: Date = new Date(),
): {
  openingTime: string;
  closingTime: string;
  closesNextDay: boolean;
  startDate: Date;
  maxOrderDate: Date;
} | null {
  const todayKey = getZonedDateKey(now);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  const yesterdaySlots = effectiveSlotsForDateKey(
    regular,
    exceptions,
    yesterdayKey,
  );
  const todaySlots = effectiveSlotsForDateKey(regular, exceptions, todayKey);

  const shifts: TargetShiftInternal[] = [];

  for (const slot of yesterdaySlots) {
    const opening = parseHHmmToMinutes(slot.openingTime);
    const closing = parseHHmmToMinutes(slot.closingTime);
    if (closing >= opening) continue;

    const closingExtended = closing + 1440;
    shifts.push({
      openingTime: slot.openingTime,
      closingTime: slot.closingTime,
      closesNextDay: slot.closesNextDay,
      startTimeline: opening,
      maxOrderTimeline: computeMaxOrderExtended(
        opening,
        closingExtended,
        minimumDeliveryTime,
        slot.maxOrderTime,
      ),
    });
  }

  for (const slot of todaySlots) {
    const opening = parseHHmmToMinutes(slot.openingTime);
    const closing = parseHHmmToMinutes(slot.closingTime);
    const closingExtended = closing < opening ? closing + 1440 : closing;

    shifts.push({
      openingTime: slot.openingTime,
      closingTime: slot.closingTime,
      closesNextDay: slot.closesNextDay,
      startTimeline: 1440 + opening,
      maxOrderTimeline:
        1440 +
        computeMaxOrderExtended(
          opening,
          closingExtended,
          minimumDeliveryTime,
          slot.maxOrderTime,
        ),
    });
  }

  shifts.sort((a, b) => a.startTimeline - b.startTimeline);

  const nowTimeline = 1440 + getZonedTimeMinutes(now);
  const target = shifts.find((s) => s.maxOrderTimeline >= nowTimeline);

  if (!target) return null;

  return {
    openingTime: target.openingTime,
    closingTime: target.closingTime,
    closesNextDay: target.closesNextDay,
    startDate: arDateTimeToUtc(yesterdayKey, target.startTimeline),
    maxOrderDate: arDateTimeToUtc(yesterdayKey, target.maxOrderTimeline),
  };
}

/** @deprecated Usar getEffectiveDaySchedule/getTargetShift. Se elimina en F5b. */
export function getTodaySchedule(
  regular: RegularScheduleDto[],
): ScheduleSlot | null {
  const { slots } = getEffectiveDaySchedule(regular, [], getZonedDateKey());
  return slots[0] ?? null;
}

export function buildWeekSchedule(
  regular: RegularScheduleDto[],
  exceptions: ExceptionDto[],
): DaySchedule[] {
  const todayKey = getZonedDateKey();
  const today = getIsoDayOfWeekFromKey(todayKey);
  const mondayKey = shiftDateKey(todayKey, -(today - 1));

  return Array.from({ length: 7 }, (_, i) => i + 1).map((dayOfWeek) => {
    const dateKey = shiftDateKey(mondayKey, dayOfWeek - 1);
    const { slots } = getEffectiveDaySchedule(regular, exceptions, dateKey);

    return {
      dayOfWeek,
      label: DAY_NAMES[dayOfWeek],
      isToday: dayOfWeek === today,
      isOpen: slots.length > 0,
      slots,
    };
  });
}
