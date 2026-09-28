const COLORS = ["bg-emerald-600", "bg-rose-500", "bg-sky-600", "bg-amber-500", "bg-violet-600", "bg-teal-600"];

/** A stable background color per person, used for their round initial. */
export function avatarColor(userId: number | null | undefined) {
  return userId ? COLORS[(userId - 1) % COLORS.length] : "bg-stone-400";
}
