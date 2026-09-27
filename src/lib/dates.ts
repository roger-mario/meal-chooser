// All plan dates are ISO "YYYY-MM-DD" strings in the app's time zone.

export const TIME_ZONE = process.env.APP_TIMEZONE || "UTC";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toDate(toIso).getTime() - toDate(fromIso).getTime()) / 86_400_000);
}

export function dateRange(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  for (let d = startIso; d <= endIso; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Monday = 0 … Sunday = 6 */
export function weekdayIndex(iso: string): number {
  return (toDate(iso).getUTCDay() + 6) % 7;
}

export function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split("-").map(Number);
  const start = toISO(new Date(Date.UTC(y, m - 1, 1)));
  const end = toISO(new Date(Date.UTC(y, m, 0)));
  return { start, end };
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toISO(new Date(Date.UTC(y, m - 1 + delta, 1))).slice(0, 7);
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return toDate(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  });
}

export function formatMonth(month: string) {
  return toDate(`${month}-01`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

export type PlanRange = "today" | "tomorrow" | "week" | "month";

export function rangeDates(range: PlanRange, month?: string): { start: string; end: string } {
  const today = todayISO();
  switch (range) {
    case "today":
      return { start: today, end: today };
    case "tomorrow": {
      const t = addDays(today, 1);
      return { start: t, end: t };
    }
    case "week":
      return { start: today, end: addDays(today, 6) };
    case "month":
      return monthBounds(month ?? today.slice(0, 7));
  }
}
