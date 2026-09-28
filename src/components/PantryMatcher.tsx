"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ingredientKey, ingredientsMatch } from "@/lib/meal-fields";

type MealLite = { id: number; name: string; imageUrl: string | null; ingredients: string[] };

const STORAGE_KEY = "meal-chooser:pantry";

export function PantryMatcher({ meals, suggestions }: { meals: MealLite[]; suggestions: string[] }) {
  const [have, setHave] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(saved)) setHave(saved.filter((s) => typeof s === "string"));
    } catch {}
  }, []);

  function save(next: string[]) {
    setHave(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function add(raw: string) {
    const items = raw
      .split(/[,\n]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .filter((s) => !have.some((h) => ingredientKey(h) === ingredientKey(s)));
    if (items.length) save([...have, ...items]);
    setDraft("");
  }

  const results = useMemo(
    () =>
      meals
        .filter((m) => m.ingredients.length > 0)
        .map((m) => {
          const found = m.ingredients.filter((need) => have.some((h) => ingredientsMatch(h, need)));
          const missing = m.ingredients.filter((need) => !found.includes(need));
          return { ...m, found, missing, pct: Math.round((found.length / m.ingredients.length) * 100) };
        })
        .filter((r) => r.found.length > 0)
        .sort((a, b) => b.pct - a.pct || a.missing.length - b.missing.length),
    [meals, have],
  );

  const quickPicks = suggestions.filter((s) => !have.some((h) => ingredientKey(h) === ingredientKey(s))).slice(0, 24);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="card h-fit space-y-4 p-5 lg:col-span-2">
        <h2 className="font-semibold">🧺 I have…</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(draft);
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            list="known-ingredients"
            placeholder="e.g. onions, potatoes, beef"
            className="input flex-1"
          />
          <datalist id="known-ingredients">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button className="btn-primary">Add</button>
        </form>

        {have.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {have.map((h) => (
              <button
                key={h}
                onClick={() => save(have.filter((x) => x !== h))}
                className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-900 hover:bg-red-100 hover:text-red-800"
                title="Remove"
              >
                {h} ✕
              </button>
            ))}
            <button onClick={() => save([])} className="px-2 text-xs text-stone-500 hover:text-stone-800">
              Clear all
            </button>
          </div>
        ) : (
          <p className="text-sm text-stone-500">Nothing added yet.</p>
        )}

        {quickPicks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">From your recipes</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPicks.map((s) => (
                <button key={s} onClick={() => add(s)} className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:border-emerald-500 hover:text-emerald-800">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-stone-400">Basics like salt, pepper and oil (🧂) are not counted.</p>
      </section>

      <section className="space-y-3 lg:col-span-3">
        {have.length === 0 ? (
          <div className="card p-10 text-center text-stone-500">Add a few ingredients to see matching meals.</div>
        ) : results.length === 0 ? (
          <div className="card p-10 text-center text-stone-500">No meal uses these ingredients yet.</div>
        ) : (
          results.map((r) => (
            <Link key={r.id} href={`/meals/${r.id}`} className="card flex gap-4 p-4 transition hover:shadow-md">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-2xl">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  "🍲"
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-semibold">{r.name}</h3>
                  <span className={`text-sm font-semibold ${r.pct === 100 ? "text-emerald-700" : "text-stone-600"}`}>
                    {r.pct === 100 ? "✓ 100%" : `${r.pct}%`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100">
                  <div
                    className={`h-2 rounded-full ${r.pct === 100 ? "bg-emerald-600" : r.pct >= 50 ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
                <p className="text-xs text-stone-500">
                  {r.found.length} of {r.found.length + r.missing.length} ingredients
                  {r.missing.length > 0 && <> · missing: {r.missing.join(", ")}</>}
                </p>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
