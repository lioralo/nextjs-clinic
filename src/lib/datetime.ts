const pad = (n: number) => String(n).padStart(2, "0");

export function toDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function parseDateInput(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function startOfWeek(date: Date, firstDay: 0 | 1 = 0): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = (day - firstDay + 7) % 7;
  result.setDate(result.getDate() - diff);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const CLINIC_OPEN_MINUTES = 8 * 60;
const CLINIC_LAST_START_MINUTES = 19 * 60 + 30;

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

/** Next 30-minute clinic slot whose start is inside 08:00–19:30 local time. */
export function snapToClinicHours(
  from = new Date(),
  durationMinutes = 60
): { start: Date; end: Date } {
  const start = new Date(from);
  start.setSeconds(0, 0);
  const remainder = start.getMinutes() % 30;
  if (remainder !== 0 || start.getTime() < from.getTime()) {
    start.setMinutes(start.getMinutes() + (30 - remainder || 30));
  }

  const mins = minutesOfDay(start);
  if (mins < CLINIC_OPEN_MINUTES) {
    start.setHours(8, 0, 0, 0);
  } else if (mins > CLINIC_LAST_START_MINUTES) {
    start.setDate(start.getDate() + 1);
    start.setHours(8, 0, 0, 0);
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end };
}
