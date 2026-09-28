import type { Category } from "@/db/schema";

/** Compact category badge: just the emoji, with the name on hover (or always when `showName`). */
export function CategoryChip({ category, showName = false }: { category: Category; showName?: boolean }) {
  return (
    <span
      title={category.name}
      className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${category.color}1f`, color: category.color }}
    >
      <span className="text-sm leading-none">{category.emoji}</span>
      <span className={showName ? "" : "hidden group-hover:inline"}>{category.name}</span>
    </span>
  );
}
