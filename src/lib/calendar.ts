export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const toISO = (d: Date) => startOfDay(d).toISOString();
export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const addMonths = (d: Date, n: number) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
export const getMonthMatrix = (anchor: Date) => {
  // Return exactly 42 dates (6 weeks) starting from the Sunday before the 1st
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const offset = first.getDay(); // 0=Sun
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

export const formatMonthTitle = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
