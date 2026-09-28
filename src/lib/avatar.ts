const COLORS = ["bg-emerald-600", "bg-rose-500", "bg-sky-600", "bg-amber-500", "bg-violet-600", "bg-teal-600"];
const TEXT_COLORS = ["text-emerald-700", "text-rose-600", "text-sky-700", "text-amber-700", "text-violet-700", "text-teal-700"];

/** A stable background color per person, used for their round initial. */
export function avatarColor(userId: number | null | undefined) {
  return userId ? COLORS[(userId - 1) % COLORS.length] : "bg-stone-400";
}

/** The matching text color, used for names in the chat. */
export function nameColor(userId: number | null | undefined) {
  return userId ? TEXT_COLORS[(userId - 1) % TEXT_COLORS.length] : "text-stone-500";
}
