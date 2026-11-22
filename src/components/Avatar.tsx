import { avatarColors, initials } from "@/lib/look";

/** A person's initials on their own pastel colour. */
export function Avatar({ id, name, size = "md" }: { id: number | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-16 w-16 text-xl" : "h-9 w-9 text-xs";
  const [bg, fg] = id == null ? ["#F6F1EA", "#6F6860"] : avatarColors(id);
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold ${dims}`} style={{ backgroundColor: bg, color: fg }} aria-hidden>
      {name === "?" ? "?" : initials(name)}
    </span>
  );
}
