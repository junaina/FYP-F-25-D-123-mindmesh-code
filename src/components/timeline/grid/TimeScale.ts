// helper to define the visible time widow and the columns to display in the time scale
//will be tweaking this for drag and drop and resizing

//also for zooming in and out
export type View = "week" | "month" | "day" | "hour";
export interface Column {
  start: Date;
  end: Date;
  day: number;
  isToday: boolean;
  isWeekend: boolean;
  weekBand: number; // 0 = first week of month, 1 = second week of month, etc.
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0); // set to start of day
  return x;
}

function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY); // add n days
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonthOf(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}
// ---------- View Title Helpers ----------
function fmt(d: Date, opt: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, opt).format(d);
}

function monthYear(d: Date) {
  return fmt(d, { month: "long", year: "numeric" });
}

function weekdayMonDay(d: Date) {
  // e.g. "Fri, Oct 10, 2025"
  const w = fmt(d, { weekday: "short" });
  const md = fmt(d, { month: "short", day: "numeric", year: "numeric" });
  return `${w}, ${md}`;
}

function hourAmPm(d: Date) {
  return fmt(d, { hour: "numeric", hour12: true });
}

function weekRangeLabel(start: Date) {
  // show 7-day window: start..start+6
  const end = new Date(start.getTime());
  end.setDate(start.getDate() + 6);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    // "Oct 6–12, 2025"
    const m = fmt(start, { month: "short" });
    const sd = start.getDate();
    const ed = end.getDate();
    const y = start.getFullYear();
    return `${m} ${sd}–${ed}, ${y}`;
  }

  // crosses month and/or year: "Oct 30 – Nov 5, 2025" (year from end)
  const left = fmt(start, { month: "short", day: "numeric" });
  const right = sameYear
    ? fmt(end, { month: "short", day: "numeric", year: "numeric" })
    : fmt(end, { month: "short", day: "numeric", year: "numeric" });
  return `${left} – ${right}`;
}

/** Returns the header title for a given view + start anchor (already ISO). */
export function viewTitle(view: View, startISO: string) {
  const s = new Date(normalizeStart(view, startISO));

  if (view === "month") return monthYear(s);
  if (view === "week") return weekRangeLabel(s);
  if (view === "day") return weekdayMonDay(s);
  // hour: "10 PM · Fri, Oct 10, 2025"
  return `${hourAmPm(s)} · ${weekdayMonDay(s)}`;
}

// ---- Navigation helpers ----
export function normalizeStart(view: View, startISO: string) {
  const d = new Date(startISO);
  if (view === "hour") {
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }
  if (view === "day" || view === "week" || view === "month") {
    const s = startOfDay(d);
    if (view === "month")
      return new Date(s.getFullYear(), s.getMonth(), 1).toISOString();
    return s.toISOString();
  }
  return d.toISOString();
}

export function stepStart(view: View, startISO: string, dir: -1 | 1) {
  const d = new Date(normalizeStart(view, startISO));
  if (view === "hour") {
    d.setHours(d.getHours() + dir);
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }
  if (view === "day") {
    d.setDate(d.getDate() + dir);
    return startOfDay(d).toISOString();
  }
  if (view === "week") {
    d.setDate(d.getDate() + 7 * dir);
    return startOfDay(d).toISOString();
  }
  // month: jump to first-of-next/prev month
  if (view === "month") {
    const y = d.getFullYear();
    const m = d.getMonth() + dir;
    return new Date(y, m, 1).toISOString();
  }
  return d.toISOString();
}

export function buildScale(view: View, startISO: string) {
  const startDate = startOfDay(new Date(startISO));
  const todayKey = startOfDay(new Date()).getTime();

  let cols: Column[] = [];
  let viewportStart: Date;
  let viewportEnd: Date;

  if (view === "hour") {
    // show 12 columns of 5-minute intervals
    const start = new Date(startISO);
    start.setMinutes(0, 0, 0);
    viewportStart = start;
    viewportEnd = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour

    for (let i = 0; i < 12; i++) {
      const s = new Date(viewportStart.getTime() + i * 5 * 60 * 1000);
      const e = new Date(s.getTime() + 5 * 60 * 1000);
      cols.push({
        start: s,
        end: e,
        day: s.getMinutes(),
        isToday: false,
        isWeekend: false,
        weekBand: Math.floor(i / 3), // band every 15 mins
      });
    }
  } else if (view === "day") {
    // 24 columns for 24 hours
    viewportStart = startDate;
    viewportEnd = new Date(viewportStart.getTime() + 24 * 60 * 60 * 1000);
    for (let i = 0; i < 24; i++) {
      const s = new Date(viewportStart.getTime() + i * 60 * 60 * 1000);
      const e = new Date(s.getTime() + 60 * 60 * 1000);
      cols.push({
        start: s,
        end: e,
        day: s.getHours(),
        isToday: startOfDay(s).getTime() === todayKey,
        isWeekend: false,
        weekBand: Math.floor(i / 6), // 4 bands in 24 hrs
      });
    }
  } else if (view === "week") {
    // 7 days
    viewportStart = startDate;
    viewportEnd = addDays(viewportStart, 7);
    for (let i = 0; i < 7; i++) {
      const s = addDays(viewportStart, i);
      const e = addDays(viewportStart, i + 1);
      cols.push({
        start: s,
        end: e,
        day: s.getDate(),
        isToday: startOfDay(s).getTime() === todayKey,
        isWeekend: s.getDay() === 0 || s.getDay() === 6,
        weekBand: 0,
      });
    }
  } else {
    // MONTH VIEW: start at the first of the month and render the whole month (28–31 days)
    const anchor = new Date(startISO);
    viewportStart = startOfMonth(anchor);
    const count = daysInMonthOf(anchor); // 28..31
    viewportEnd = addDays(viewportStart, count);

    const startDow = viewportStart.getDay(); // 0=Sun..6=Sat (used for banding)

    for (let i = 0; i < count; i++) {
      const s = addDays(viewportStart, i);
      const e = addDays(viewportStart, i + 1);
      cols.push({
        start: s,
        end: e,
        day: s.getDate(), // label = calendar day
        isToday: startOfDay(s).getTime() === todayKey, // highlights today pill
        isWeekend: s.getDay() === 0 || s.getDay() === 6,
        weekBand: Math.floor((startDow + i) / 7), // alternate by week rows
      });
    }
  }

  const startMs = viewportStart.getTime();
  const endMs = viewportEnd.getTime();

  const timeToPct = (ms: number) => {
    const span = Math.max(1, endMs - startMs);
    return Math.max(0, Math.min(100, ((ms - startMs) / span) * 100));
  };
  const pctToTime = (pct: number) => startMs + (pct / 100) * (endMs - startMs);

  return { startMs, endMs, columns: cols, timeToPct, pctToTime };
}
