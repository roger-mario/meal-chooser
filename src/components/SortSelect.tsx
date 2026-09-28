"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS, type Sort } from "@/lib/meal-sort";

export function SortSelect({ value }: { value: Sort }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="relative shrink-0">
      <span className="sr-only">Sort meals</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value === "new") next.delete("sort");
          else next.set("sort", e.target.value);
          router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
        }}
        className="input h-full cursor-pointer appearance-none rounded-xl py-2.5 pr-9 pl-3 text-sm font-medium text-stone-700"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-stone-400">▼</span>
    </label>
  );
}
