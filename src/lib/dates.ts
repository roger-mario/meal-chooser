// Dates are ISO "YYYY-MM-DD" strings in the app's time zone.

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

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return toDate(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  });
}

/** The hour (0–23) in the app's time zone. */
export function currentHour(): number {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }).format(new Date())) % 24;
}
