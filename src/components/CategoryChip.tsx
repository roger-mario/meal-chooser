import type { Category } from "@/db/schema";

export function CategoryChip({ category, active = true }: { category: Category; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={
        active
          ? { backgroundColor: `${category.color}22`, color: category.color }
          : { backgroundColor: "#f5f5f4", color: "#57534e" }
      }
    >
      {category.name}
    </span>
  );
}
