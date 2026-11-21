/** Days as "YYYY-MM-DD" in the phone's time zone. */
export function isoDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDay(d);
}
export function dayLabel(iso: string, today: string) {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric" });
}
export function longDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 11 ? "Good morning" : h < 17 ? "Hello" : "Good evening";
}
export function monthDays(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const first = new Date(d.getFullYear(), d.getMonth(), 1, 12);
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  return { lead, days: Array.from({ length: days }, (_, i) => isoDay(new Date(d.getFullYear(), d.getMonth(), i + 1, 12))), title: first.toLocaleDateString("en-GB", { month: "long" }) };
}
