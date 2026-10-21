import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExceptionDto, RegularScheduleDto } from '../api/tenants';
import {
  buildTimeOptions,
  buildWeekSchedule,
  formatSlot,
  getEffectiveDaySchedule,
  getTargetShift,
  getZonedDateKey,
} from './schedule';

function makeRegular(
  overrides: Partial<RegularScheduleDto> &
    Pick<RegularScheduleDto, 'dayOfWeek' | 'openingTime' | 'closingTime'>,
): RegularScheduleDto {
  return {
    id: `regular-${overrides.dayOfWeek}-${overrides.openingTime}`,
    maxOrderTime: null,
    closesNextDay: false,
    ...overrides,
  };
}

function makeException(
  overrides: Partial<ExceptionDto> & Pick<ExceptionDto, 'date'>,
): ExceptionDto {
  return {
    id: `exception-${overrides.date}`,
    isOpen: false,
    openingTime: null,
    closingTime: null,
    maxOrderTime: null,
    closesNextDay: false,
    reason: null,
    ...overrides,
  };
}

const fridayCrossingMidnight = makeRegular({
  dayOfWeek: 5,
  openingTime: '20:00',
  closingTime: '02:00',
  closesNextDay: true,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('formatSlot', () => {
  it('formatea una franja normal recortando a HH:mm', () => {
    expect(
      formatSlot({
        openingTime: '09:00:00',
        closingTime: '18:00:00',
        closesNextDay: false,
      }),
    ).toBe('09:00 – 18:00');
  });

  it('agrega (+1) cuando el cierre es al día siguiente', () => {
    expect(
      formatSlot({
        openingTime: '20:00',
        closingTime: '02:00',
        closesNextDay: true,
      }),
    ).toBe('20:00 – 02:00 (+1)');
  });
});

describe('getTargetShift', () => {
  it('devuelve el turno del viernes a la madrugada y aplica el fallback de maxOrderTime', () => {
    const now = new Date('2026-10-17T01:00:00-03:00');

    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);

    expect(target).not.toBeNull();
    expect(target?.openingTime).toBe('20:00');
    expect(target?.closingTime).toBe('02:00');
    expect(target?.closesNextDay).toBe(true);
    expect(target?.startDate).toEqual(
      new Date('2026-10-16T20:00:00-03:00'),
    );
    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-17T01:30:00-03:00'),
    );
  });

  it('incluye el turno cuando now es exactamente maxOrderDate', () => {
    const now = new Date('2026-10-17T01:30:00-03:00');

    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);

    expect(target?.openingTime).toBe('20:00');
    expect(target?.maxOrderDate).toEqual(now);
  });

  it('pasa al siguiente turno o devuelve null cuando ya pasó maxOrderTime', () => {
    const saturdayCrossingMidnight = makeRegular({
      dayOfWeek: 6,
      openingTime: '20:00',
      closingTime: '02:00',
      closesNextDay: true,
    });
    const now = new Date('2026-10-17T01:40:00-03:00');

    expect(
      getTargetShift([fridayCrossingMidnight], [], 30, now),
    ).toBeNull();

    const target = getTargetShift(
      [fridayCrossingMidnight, saturdayCrossingMidnight],
      [],
      30,
      now,
    );

    expect(target?.openingTime).toBe('20:00');
    expect(target?.startDate).toEqual(
      new Date('2026-10-17T20:00:00-03:00'),
    );
    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-18T01:30:00-03:00'),
    );
  });

  it('respeta un maxOrderTime explícito que cae después de medianoche', () => {
    const fridayWithExplicitMax = makeRegular({
      dayOfWeek: 5,
      openingTime: '20:00',
      closingTime: '02:00',
      maxOrderTime: '01:00',
      closesNextDay: true,
    });
    const now = new Date('2026-10-16T22:00:00-03:00');

    const target = getTargetShift([fridayWithExplicitMax], [], 30, now);

    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-17T01:00:00-03:00'),
    );
  });

  it('elige el siguiente turno cuando now cae entre turnos', () => {
    const mondayLunch = makeRegular({
      dayOfWeek: 1,
      openingTime: '12:00',
      closingTime: '15:00',
    });
    const mondayDinner = makeRegular({
      dayOfWeek: 1,
      openingTime: '20:00',
      closingTime: '23:30',
    });
    const now = new Date('2026-10-19T16:00:00-03:00');

    const target = getTargetShift(
      [mondayLunch, mondayDinner],
      [],
      30,
      now,
    );

    expect(target?.openingTime).toBe('20:00');
    expect(target?.closingTime).toBe('23:30');
    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-19T23:00:00-03:00'),
    );
  });

  it('devuelve null cuando no hay horarios configurados', () => {
    expect(
      getTargetShift([], [], 30, new Date('2026-10-20T12:00:00-03:00')),
    ).toBeNull();
  });

  it('una excepción cerrada anula los regulares de esa fecha', () => {
    const monday = makeRegular({
      dayOfWeek: 1,
      openingTime: '12:00',
      closingTime: '15:00',
    });
    const closed = makeException({ date: '2026-10-19', isOpen: false });

    expect(
      getTargetShift(
        [monday],
        [closed],
        30,
        new Date('2026-10-19T12:00:00-03:00'),
      ),
    ).toBeNull();
  });

  it('una excepción abierta funciona como única franja en un día sin regulares', () => {
    const open = makeException({
      date: '2026-10-19',
      isOpen: true,
      openingTime: '12:00',
      closingTime: '18:00',
    });
    const now = new Date('2026-10-19T13:00:00-03:00');

    const target = getTargetShift([], [open], 30, now);

    expect(target?.openingTime).toBe('12:00');
    expect(target?.closingTime).toBe('18:00');
    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-19T17:30:00-03:00'),
    );
  });

  it('interpreta now en TZ AR aunque el Date esté expresado en UTC', () => {
    const now = new Date('2026-10-17T02:00:00Z');

    expect(getZonedDateKey(now)).toBe('2026-10-16');

    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);

    expect(target?.openingTime).toBe('20:00');
    expect(target?.startDate).toEqual(
      new Date('2026-10-16T20:00:00-03:00'),
    );
    expect(target?.maxOrderDate).toEqual(
      new Date('2026-10-17T01:30:00-03:00'),
    );
  });
});

describe('buildTimeOptions', () => {
  it('viernes 22:00 con turno 20:00-02:00 y mínimo 30 termina en sábado 01:30', () => {
    const now = new Date('2026-10-16T22:00:00-03:00');
    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(options.at(-1)).toEqual(
      new Date('2026-10-17T01:30:00-03:00'),
    );
  });

  it('con maxOrderDate 01:40 la última opción es 01:30', () => {
    const fridayUntil0140 = makeRegular({
      dayOfWeek: 5,
      openingTime: '20:00',
      closingTime: '02:00',
      maxOrderTime: '01:40',
      closesNextDay: true,
    });
    const now = new Date('2026-10-16T22:00:00-03:00');
    const target = getTargetShift([fridayUntil0140], [], 30, now);
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(options.at(-1)).toEqual(
      new Date('2026-10-17T01:30:00-03:00'),
    );
    expect(options.at(-1)?.getTime()).toBeLessThan(
      target.maxOrderDate.getTime(),
    );
  });

  it('devuelve lista vacía cuando now + mínimo supera maxOrderDate', () => {
    const now = new Date('2026-10-17T01:10:00-03:00');
    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(options).toEqual([]);
  });

  it('incluye maxOrderDate cuando el borde cae exactamente en un múltiplo de 15', () => {
    const now = new Date('2026-10-17T01:00:00-03:00');
    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(options).toEqual([target.maxOrderDate]);
  });

  it('viernes 22:07 con mínimo 30 arranca en 22:45', () => {
    const now = new Date('2026-10-16T22:07:00-03:00');
    const target = getTargetShift([fridayCrossingMidnight], [], 30, now);
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(options[0]).toEqual(new Date('2026-10-16T22:45:00-03:00'));
  });

  it('entre turnos arranca en el startDate del turno siguiente', () => {
    const mondayLunch = makeRegular({
      dayOfWeek: 1,
      openingTime: '12:00',
      closingTime: '15:00',
    });
    const mondayDinner = makeRegular({
      dayOfWeek: 1,
      openingTime: '20:00',
      closingTime: '23:30',
    });
    const now = new Date('2026-10-19T16:00:00-03:00');
    const target = getTargetShift(
      [mondayLunch, mondayDinner],
      [],
      30,
      now,
    );
    if (!target) throw new Error('Se esperaba un turno objetivo');

    const options = buildTimeOptions(target, 30, now);

    expect(target.openingTime).toBe('20:00');
    expect(options[0]).toEqual(target.startDate);
  });
});

describe('getEffectiveDaySchedule', () => {
  it('devuelve cerrado y sin franjas cuando no hay horarios', () => {
    expect(getEffectiveDaySchedule([], [], '2026-10-20')).toEqual({
      isOpen: false,
      slots: [],
    });
  });

  it('devuelve todas las franjas efectivas con closesNextDay', () => {
    expect(
      getEffectiveDaySchedule([fridayCrossingMidnight], [], '2026-10-16'),
    ).toEqual({
      isOpen: true,
      slots: [
        {
          openingTime: '20:00',
          closingTime: '02:00',
          closesNextDay: true,
        },
      ],
    });
  });

  it('una excepción cerrada anula los regulares de esa fecha', () => {
    const monday = makeRegular({
      dayOfWeek: 1,
      openingTime: '12:00',
      closingTime: '15:00',
    });
    const closed = makeException({ date: '2026-10-19', isOpen: false });

    expect(
      getEffectiveDaySchedule([monday], [closed], '2026-10-19'),
    ).toEqual({ isOpen: false, slots: [] });
  });

  it('una excepción abierta reemplaza la ausencia de regulares', () => {
    const open = makeException({
      date: '2026-10-19',
      isOpen: true,
      openingTime: '12:00',
      closingTime: '18:00',
    });

    expect(getEffectiveDaySchedule([], [open], '2026-10-19')).toEqual({
      isOpen: true,
      slots: [
        {
          openingTime: '12:00',
          closingTime: '18:00',
          closesNextDay: false,
        },
      ],
    });
  });
});

describe('buildWeekSchedule', () => {
  it('resuelve la semana en curso y aplica la excepción del día', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-21T12:00:00-03:00'));

    const monday = makeRegular({
      dayOfWeek: 1,
      openingTime: '12:00',
      closingTime: '15:00',
    });
    const wednesdayOpen = makeException({
      date: '2026-10-21',
      isOpen: true,
      openingTime: '10:00',
      closingTime: '14:00',
    });

    const week = buildWeekSchedule(
      [monday, fridayCrossingMidnight],
      [wednesdayOpen],
    );
    const byDay = new Map(week.map((day) => [day.dayOfWeek, day]));

    expect(week).toHaveLength(7);
    expect(byDay.get(2)).toMatchObject({ isOpen: false, slots: [] });
    expect(byDay.get(1)?.slots).toEqual([
      { openingTime: '12:00', closingTime: '15:00', closesNextDay: false },
    ]);
    expect(byDay.get(3)).toMatchObject({ isToday: true, isOpen: true });
    expect(byDay.get(3)?.slots).toEqual([
      { openingTime: '10:00', closingTime: '14:00', closesNextDay: false },
    ]);
    expect(byDay.get(5)?.slots).toEqual([
      { openingTime: '20:00', closingTime: '02:00', closesNextDay: true },
    ]);
  });
});
