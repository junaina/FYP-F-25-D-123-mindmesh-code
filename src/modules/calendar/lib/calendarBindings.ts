// modules/calendar/lib/calendarBindings.ts
export const CAL_BINDINGS = {
  single: "date",
  range: { start: "start", end: "end" },
} as const;

// "YYYY-MM-DD" → Date at UTC midnight
export function parseYmdToUTC(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}
export function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
