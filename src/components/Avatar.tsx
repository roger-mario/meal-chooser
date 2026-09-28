import { avatarColor } from "@/lib/avatar";

export function Avatar({ id, name, size = "md" }: { id: number | null; name: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-6 w-6 text-[11px]" : "h-9 w-9 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dims} ${avatarColor(id)}`}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
