// File: src/lib/utils/calendar-date.ts

// Start of day (local)
export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// ISO string for a date at start of day (local -> ISO)
export const toISO = (d: Date) => startOfDay(d).toISOString();

// Add N days
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Add N months
export const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

// 6-week month matrix (42 days), starting from the Sunday before the 1st
export const getMonthMatrix = (anchor: Date) => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const offset = first.getDay(); // 0 = Sun ... 6 = Sat
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

// Same-day helper
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Month title like “September 2025”
export const formatMonthTitle = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
