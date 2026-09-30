"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/meals";
import type { Category } from "@/db/schema";
import {
  DIETS,
  DIFFICULTIES,
  formatMinutes,
  looksLikeStaple,
  UNITS,
  type Diet,
  type Difficulty,
  type Ingredient,
  type MealLink,
} from "@/lib/meal-fields";
import { ImageInput } from "./ImageInput";
import { SubmitButton } from "./SubmitButton";

export type MealFormValues = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  servings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  difficulty: Difficulty | null;
  diet: Diet | null;
  babyFriendly: boolean;
  ingredients: Ingredient[];
  steps: string[];
  links: MealLink[];
  categoryIds: number[];
};

type Row = Ingredient & { key: number; touchedStaple?: boolean };
let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, name: "", unit: "g" });

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {hint && <p className="text-sm text-stone-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string>({
  name,
  options,
  value,
  onChange,
  noneLabel,
}: {
  name: string;
  options: readonly { value: T; label: string; emoji?: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
  noneLabel: string;
}) {
  const all = [{ value: null as T | null, label: noneLabel, emoji: undefined as string | undefined }, ...options];
  return (
    <div className="inline-flex flex-wrap rounded-xl bg-stone-100 p-1">
      <input type="hidden" name={name} value={value ?? ""} />
      {all.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-2 text-sm transition sm:py-1.5 ${
            value === o.value ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {o.emoji && <span className="mr-1">{o.emoji}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MealForm({
  action,
  categories,
  initial,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  categories: Category[];
  initial?: MealFormValues;
}) {
  const [state, formAction] = useActionState(action, null);
  const [prep, setPrep] = useState(initial?.prepMinutes?.toString() ?? "");
  const [cook, setCook] = useState(initial?.cookMinutes?.toString() ?? "");
  const [servings, setServings] = useState(initial?.servings ?? 2);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(initial?.difficulty ?? null);
  const [babyFriendly, setBabyFriendly] = useState(initial?.babyFriendly ?? false);
  const [diet, setDiet] = useState<Diet | null>(initial?.diet ?? null);
  const [rows, setRows] = useState<Row[]>(() =>
    initial?.ingredients.length
      ? initial.ingredients.map((i) => ({ ...i, key: nextKey++, touchedStaple: true }))
      : [emptyRow(), emptyRow(), emptyRow()],
  );
  const [steps, setSteps] = useState<string[]>(initial?.steps.length ? initial.steps : ["", ""]);
  const [links, setLinks] = useState<MealLink[]>(initial?.links.length ? initial.links : [{ url: "" }]);
  const [selectedCats, setSelectedCats] = useState(new Set(initial?.categoryIds));

  const total = (Number(prep) || 0) + (Number(cook) || 0);

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // Suggest the "basic" flag for salt, pepper, oil … until the user sets it themselves.
        if (patch.name !== undefined && !r.touchedStaple) next.staple = looksLikeStaple(patch.name);
        return next;
      }),
    );
  }

  const ingredientsJson = JSON.stringify(
    rows
      .filter((r) => r.name.trim())
      .map(({ name, variant, quantity, quantityMax, unit, staple }) => ({ name, variant, quantity, quantityMax, unit, staple })),
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="ingredients" value={ingredientsJson} />
      <input type="hidden" name="steps" value={JSON.stringify(steps.filter((s) => s.trim()))} />
      <input type="hidden" name="links" value={JSON.stringify(links.filter((l) => l.url.trim()))} />

      <Section title="The basics">
        <div className="grid gap-5 md:grid-cols-2">
          <ImageInput currentUrl={initial?.imageUrl} />
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" required defaultValue={initial?.name} placeholder="Grandma's lasagne" className="input text-base" />
            </div>
            <div>
              <label className="label" htmlFor="description">Short description <span className="font-normal text-stone-400">(optional)</span></label>
              <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} placeholder="Cheesy, cozy, perfect for Sundays" className="input" />
            </div>
            {initial?.imageUrl && (
              <label className="flex items-center gap-2 text-sm text-stone-600">
                <input type="checkbox" name="removeImage" /> Remove current photo
              </label>
            )}
          </div>
        </div>
      </Section>

      <Section title="Details">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="servings">Servings</label>
            <div className="flex items-center rounded-lg border border-stone-300 bg-white">
              <button type="button" className="px-3 py-2 text-stone-500 hover:text-stone-900" onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Fewer servings">−</button>
              <input id="servings" name="servings" type="number" min={1} value={servings} onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))} className="w-full min-w-0 bg-transparent py-2 text-center text-base focus:outline-none sm:text-sm" />
              <button type="button" className="px-3 py-2 text-stone-500 hover:text-stone-900" onClick={() => setServings((s) => s + 1)} aria-label="More servings">+</button>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="prepMinutes">Prep time</label>
            <div className="relative">
              <input id="prepMinutes" name="prepMinutes" type="number" min={0} inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="15" className="input pr-12" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-stone-400">min</span>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="cookMinutes">Cooking time</label>
            <div className="relative">
              <input id="cookMinutes" name="cookMinutes" type="number" min={0} inputMode="numeric" value={cook} onChange={(e) => setCook(e.target.value)} placeholder="30" className="input pr-12" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-stone-400">min</span>
            </div>
          </div>
          <div>
            <span className="label">Total</span>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {total > 0 ? `⏱ ${formatMinutes(total)}` : "—"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <div>
            <span className="label">Difficulty <span className="font-normal text-stone-400">(optional)</span></span>
            <Segmented name="difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} noneLabel="Not set" />
          </div>
          <div>
            <span className="label">Diet <span className="font-normal text-stone-400">(optional)</span></span>
            <Segmented name="diet" options={DIETS} value={diet} onChange={setDiet} noneLabel="Any" />
          </div>
          <div>
            <span className="label">Good for babies?</span>
            <label
              className={`inline-flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                babyFriendly ? "bg-sky-100 font-medium text-sky-900" : "bg-stone-100 text-stone-500 hover:text-stone-800"
              }`}
            >
              <input
                type="checkbox"
                name="babyFriendly"
                checked={babyFriendly}
                onChange={(e) => setBabyFriendly(e.target.checked)}
                className="sr-only"
              />
              👶 {babyFriendly ? "Baby-friendly" : "Not marked"}
            </label>
          </div>
        </div>
        {categories.length > 0 && (
          <div>
            <span className="label">Categories</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = selectedCats.has(c.id);
                return (
                  <label
                    key={c.id}
                    className={`cursor-pointer select-none rounded-full border px-3 py-1.5 text-sm transition ${
                      on ? "border-transparent text-white" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                    }`}
                    style={on ? { backgroundColor: c.color } : undefined}
                  >
                    <input
                      type="checkbox"
                      name="categoryIds"
                      value={c.id}
                      checked={on}
                      onChange={() =>
                        setSelectedCats((s) => {
                          const n = new Set(s);
                          if (n.has(c.id)) n.delete(c.id);
                          else n.add(c.id);
                          return n;
                        })
                      }
                      className="sr-only"
                    />
                    <span className="mr-1">{c.emoji}</span>
                    {c.name}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Shopping list"
        hint="Kind and max are optional: chicken · breast, rice · jasmine, 600 – 700 g. Mark basics like salt, pepper or oil with 🧂; they are skipped when matching meals to what you have at home."
      >
        <div className="space-y-2">
          {rows.map((r, idx) => (
            <div
              key={r.key}
              className="space-y-2 rounded-xl bg-stone-50 p-2 sm:flex sm:items-center sm:gap-2 sm:space-y-0 sm:bg-transparent sm:p-0"
            >
              <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto_auto] items-center gap-2 sm:contents">
                <input
                  value={r.name}
                  onChange={(e) => updateRow(r.key, { name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (idx === rows.length - 1) setRows((rs) => [...rs, emptyRow()]);
                    }
                  }}
                  placeholder={["Potatoes", "Onions", "Beef mince"][idx] ?? "Ingredient"}
                  aria-label="Ingredient"
                  className="input min-w-0 sm:flex-[3]"
                />
                <input
                  value={r.variant ?? ""}
                  onChange={(e) => updateRow(r.key, { variant: e.target.value || undefined })}
                  placeholder={["e.g. waxy", "e.g. red", "e.g. lean"][idx] ?? "Kind (optional)"}
                  aria-label="Kind or variety (optional)"
                  title="Optional kind, cut or variety, e.g. breast or jasmine"
                  className="input min-w-0 sm:flex-[2]"
                />
                <button
                  type="button"
                  title={r.staple ? "Basic ingredient (salt, oil …)" : "Mark as basic ingredient"}
                  aria-pressed={!!r.staple}
                  onClick={() => updateRow(r.key, { staple: !r.staple, touchedStaple: true })}
                  className={`h-10 w-10 shrink-0 rounded-lg sm:order-1 text-lg transition ${r.staple ? "bg-amber-100" : "opacity-30 grayscale hover:opacity-70"}`}
                >
                  🧂
                </button>
                <button
                  type="button"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [emptyRow()]))}
                  aria-label="Remove ingredient"
                  className="h-10 w-8 shrink-0 text-stone-400 sm:order-1 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 sm:contents">
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={r.quantity ?? ""}
                  onChange={(e) => updateRow(r.key, { quantity: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Qty"
                  aria-label="Quantity"
                  className="input min-w-0 flex-1 sm:w-20 sm:flex-none"
                />
                <span className="text-stone-400" aria-hidden>
                  –
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={r.quantityMax ?? ""}
                  onChange={(e) => updateRow(r.key, { quantityMax: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Max"
                  aria-label="Maximum quantity (optional)"
                  title="Optional: give a range like 600 – 700 g"
                  className="input min-w-0 flex-1 sm:w-20 sm:flex-none"
                />
                <select
                  value={r.unit ?? ""}
                  onChange={(e) => updateRow(r.key, { unit: e.target.value || undefined })}
                  aria-label="Unit"
                  className="input w-24 shrink-0"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows((rs) => [...rs, emptyRow()])} className="btn">
          + Add ingredient
        </button>
      </Section>

      <Section title="Steps">
        <ol className="space-y-3">
          {steps.map((s, idx) => (
            <li key={idx} className="flex items-start gap-2 sm:gap-3">
              <span className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <textarea
                value={s}
                onChange={(e) => setSteps((st) => st.map((x, i) => (i === idx ? e.target.value : x)))}
                rows={2}
                placeholder={idx === 0 ? "Peel and dice the potatoes." : "Next step…"}
                aria-label={`Step ${idx + 1}`}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => setSteps((st) => (st.length > 1 ? st.filter((_, i) => i !== idx) : [""]))}
                aria-label="Remove step"
                className="h-10 w-8 text-stone-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setSteps((st) => [...st, ""])} className="btn">
          + Add step
        </button>
      </Section>

      <Section title="Sources" hint="Optional: links to the original recipe, a video, a blog post …">
        <div className="space-y-2">
          {links.map((l, idx) => (
            <div key={idx} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex">
              <input
                value={l.url}
                onChange={(e) => setLinks((ls) => ls.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
                type="url"
                inputMode="url"
                placeholder="https://www.youtube.com/watch?v=…"
                aria-label="Link"
                className="input col-span-2 min-w-0 sm:flex-[2]"
              />
              <input
                value={l.label ?? ""}
                onChange={(e) => setLinks((ls) => ls.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                placeholder="Name (optional)"
                aria-label="Link name"
                className="input min-w-0 sm:flex-1"
              />
              <button
                type="button"
                onClick={() => setLinks((ls) => (ls.length > 1 ? ls.filter((_, i) => i !== idx) : [{ url: "" }]))}
                aria-label="Remove link"
                className="h-10 w-8 text-stone-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLinks((ls) => [...ls, { url: "" }])} className="btn">
          + Add link
        </button>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-stone-200 bg-stone-50/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        {state?.error && <p className="text-sm text-red-600 sm:mr-auto">{state.error}</p>}
        <SubmitButton pendingText="Saving…" className="btn-primary h-12 w-full text-base sm:h-auto sm:w-auto sm:text-sm">
          {initial ? "Save changes" : "Save meal"}
        </SubmitButton>
      </div>
    </form>
  );
}
