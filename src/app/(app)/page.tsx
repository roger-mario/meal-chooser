import Link from "next/link";
import { AuthorLine } from "@/components/AuthorLine";
import { CategoryChip } from "@/components/CategoryChip";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MealImage } from "@/components/MealImage";
import { MealMeta } from "@/components/MealMeta";
import { SearchBox } from "@/components/SearchBox";
import { costPerServing, formatChf } from "@/lib/cost";
import { listCategories, listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealsPage({ searchParams }: PageProps<"/">) {
  const { category, q } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const query = typeof q === "string" ? q.trim() : "";
  const [meals, categories] = await Promise.all([listMeals({ categoryId, q: query }), listCategories()]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your meals</h1>
        <SearchBox />
        <CategoryFilter categories={categories} activeId={categoryId} q={query} />
      </div>

      {meals.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="text-5xl">🍲</span>
          <p className="text-stone-600">
            {query ? `Nothing found for "${query}".` : categoryId ? "No meals in this category yet." : "No meals yet."}
          </p>
          {!query && (
            <Link href="/meals/new" className="btn-primary">
              Add your first favourite meal
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((m) => (
            <li key={m.id}>
              <Link href={`/meals/${m.id}`} className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                <MealImage src={m.imageUrl} alt={m.name} className="transition group-hover:brightness-105" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug">{m.name}</h2>
                    {m.nutrition?.perServing.calories != null && (
                      <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        {Math.round(m.nutrition.perServing.calories)} kcal
                      </span>
                    )}
                  </div>
                  <MealMeta meal={m} />
                  {costPerServing(m.cost, m.servings) != null && (
                    <p className="text-sm font-medium text-amber-800">
                      💰 {formatChf(costPerServing(m.cost, m.servings)!)} <span className="font-normal text-stone-500">per portion</span>
                    </p>
                  )}
                  <AuthorLine author={m.author} createdAt={m.createdAt} updatedAt={m.updatedAt} compact />
                  {m.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.categories.map((c) => (
                        <CategoryChip key={c.id} category={c} />
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
