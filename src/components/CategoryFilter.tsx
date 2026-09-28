"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Category } from "@/db/schema";

const STORAGE_KEY = "meal-chooser:show-category-names";

export function CategoryFilter({ categories, activeId, q }: { categories: Category[]; activeId?: number; q?: string }) {
  const href = (categoryId?: number) => {
    const params = new URLSearchParams();
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

  const pill = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition";
  return (
    <div className="flex flex-wrap items-center gap-2">
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
            title={c.name}
            className={`group ${pill} ${active ? "border-transparent text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}
            style={active ? { backgroundColor: c.color } : undefined}
          >
            <span className="text-base leading-none">{c.emoji}</span>
            <span className={showNames || active ? "" : "hidden group-hover:inline"}>{c.name}</span>
          </Link>
        );
      })}
      {categories.length > 0 && (
        <>
          <button type="button" onClick={toggle} className="px-2 text-xs text-stone-500 hover:text-stone-800">
            {showNames ? "Hide names" : "Show names"}
          </button>
          <Link href="/categories" className="px-1 text-xs text-stone-500 hover:text-stone-800">
            Edit categories
          </Link>
        </>
      )}
    </div>
  );
}
