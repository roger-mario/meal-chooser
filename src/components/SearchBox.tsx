"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Updates ?q= as you type (debounced), keeping the category filter. */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value.trim() === current) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search meals, ingredients, authors… e.g. chicken"
        aria-label="Search meals"
        className="input rounded-xl py-2.5 pl-10 text-base"
      />
    </div>
  );
}
