import type { Metadata } from "next";
import { MealCard } from "@/components/MealCard";
import { PublicHeader } from "@/components/PublicMeal";
import { SearchBox } from "@/components/SearchBox";
import { listPublicMeals } from "@/lib/collection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Recipe collection · Otao", robots: { index: false } };

// Public, read-only list of the meals their authors made public. No links into the app.
export default async function CollectionPage({ searchParams }: PageProps<"/collection">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const meals = await listPublicMeals({ q: query });

  return (
    <>
      <PublicHeader badge="Recipe collection" short="Collection" href="/collection" />
      <main className="pb-safe mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5 sm:space-y-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">🌍 Recipe collection</h1>
          <p className="text-sm text-stone-600 sm:text-base">Meals the Otao community shares, with prices and nutrition.</p>
        </div>
        <SearchBox />
        {meals.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="text-5xl">🍲</span>
            <p className="text-stone-600">{query ? `Nothing found for "${query}".` : "No public recipes yet."}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {meals.map((m, i) => (
              <li key={m.id}>
                <MealCard meal={m} preload={i < 4} href={`/collection/${m.id}`} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
