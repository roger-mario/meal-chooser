import Link from "next/link";
import { PantryMatcher } from "@/components/PantryMatcher";
import { collectionInApp, quickPicks } from "@/lib/collection";
import { ingredientKey } from "@/lib/meal-fields";
import { listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const SOURCES = [
  { value: "", label: "All meals" },
  { value: "picks", label: "⭐ Quick picks" },
  { value: "public", label: "🌍 Public collection" },
] as const;

export default async function CookPage({ searchParams }: PageProps<"/cook">) {
  const { from } = await searchParams;
  const [all, collection, me] = await Promise.all([listMeals(), collectionInApp(), getCurrentUser()]);
  const source = collection ? SOURCES.find((s) => s.value === from)?.value ?? "" : "";
  const meals =
    source === "picks" ? (me ? await quickPicks(me.id, all, 24) : []) : source === "public" ? all.filter((m) => m.isPublic) : all;
  const known = new Map<string, string>();
  for (const m of meals) {
    for (const i of m.ingredients) {
      if (!i.staple && !known.has(ingredientKey(i.name))) known.set(ingredientKey(i.name), i.name.toLowerCase());
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What can I cook?</h1>
        <p className="text-sm text-stone-600 sm:text-base">Add what you have at home and see which meals you can (almost) make.</p>
      </div>
      {collection && (
        <nav className="-mx-4 overflow-x-auto px-4" aria-label="Which meals">
          <ul className="flex gap-1.5 text-sm whitespace-nowrap">
            {SOURCES.filter((s) => s.value !== "picks" || me).map((s) => (
              <li key={s.value}>
                <Link
                  href={s.value ? `/cook?from=${s.value}` : "/cook"}
                  aria-current={s.value === source ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full px-3.5 font-medium transition ${
                    s.value === source ? "bg-emerald-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {collection && meals.length === 0 && (
        <p className="text-sm text-stone-500">
          {source === "picks"
            ? "No quick picks yet. Star meals with ☆ Favourite or use them a bit, and they show up here."
            : "No public meals yet. Make one public with 🔒 Private on its meal page."}
        </p>
      )}
      <PantryMatcher
        meals={meals.map((m) => ({
          id: m.id,
          name: m.name,
          imageUrl: m.imageUrl,
          ingredients: m.ingredients.filter((i) => !i.staple).map((i) => i.name),
        }))}
        suggestions={[...known.values()].sort()}
      />
    </div>
  );
}
