"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Category } from "@/db/schema";

const STORAGE_KEY = "meal-chooser:show-category-names";

export function CategoryFilter({
  categories,
  counts = {},
  activeId,
  q,
}: {
  categories: Category[];
  counts?: Record<number, number>;
  activeId?: number;
  q?: string;
}) {
  const searchParams = useSearchParams();
  const href = (categoryId?: number) => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    if (categoryId) params.set("category", String(categoryId));
    if (q) params.set("q", q);
    return params.size ? `/?${params}` : "/";
  };
  const [showNames, setShowNames] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowNames(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {}
  }, []);
  function toggle() {
    setShowNames((v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  }

  const pill = "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition";
  return (
    // One scrollable row on phones, wrapping on bigger screens.
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      <Link
        href={href()}
        className={`${pill} ${!activeId ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}
      >
        All
      </Link>
      {categories.map((c) => {
        const active = activeId === c.id;
        return (
          <Link
            key={c.id}
            href={href(active ? undefined : c.id)}
            title={`${c.name} (${counts[c.id] ?? 0})`}
            className={`group ${pill} ${active ? "border-transparent text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}
            style={active ? { backgroundColor: c.color } : undefined}
          >
            <span className="text-base leading-none">{c.emoji}</span>
            {/* Phones have no hover, so names always show there; the row scrolls sideways. */}
            <span className={showNames || active ? "" : "sm:hidden sm:group-hover:inline"}>{c.name}</span>
            {(showNames || active) && counts[c.id] != null && (
              <span className={`text-xs ${active ? "text-white/80" : "text-stone-400"}`}>{counts[c.id]}</span>
            )}
          </Link>
        );
      })}
      {categories.length > 0 && (
        <>
          <button type="button" onClick={toggle} className="hidden shrink-0 px-2 text-xs text-stone-500 hover:text-stone-800 sm:inline">
            {showNames ? "Hide names" : "Show names"}
          </button>
          <Link href="/categories" className="hidden shrink-0 px-1 text-xs text-stone-500 hover:text-stone-800 sm:inline">
            Edit categories
          </Link>
        </>
      )}
    </div>
  );
}
