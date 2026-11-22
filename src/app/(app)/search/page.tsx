import { sql } from "drizzle-orm";
import Link from "next/link";
import { after } from "next/server";
import { db } from "@/db";
import { CategoryFilter } from "@/components/CategoryFilter";
import { RecipeGrid } from "@/components/v7/RecipeCards";
import { RandomButton } from "@/components/RandomButton";
import { SearchBox } from "@/components/SearchBox";
import { SortSelect } from "@/components/SortSelect";
import { parseSort, sortMeals } from "@/lib/meal-sort";
import { categoryCounts, listCategories, listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { category, q, ingredient: ingredientParam, variant: variantParam, sort: sortParam } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const query = typeof q === "string" ? q.trim() : "";
  const ingredient = typeof ingredientParam === "string" ? ingredientParam.trim().slice(0, 80) : "";
  const variant = ingredient && typeof variantParam === "string" ? variantParam.trim().slice(0, 80) : "";
  const sort = parseSort(sortParam);
  const [found, categories, counts] = await Promise.all([
    listMeals({ categoryId, q: query, ingredient, variant }),
    listCategories(),
    categoryCounts(),
  ]);
  const meals = sortMeals(found, sort);
  const filtering = Boolean(query || categoryId || ingredient);
  // The lists above come from the cache. Wake the database now so opening a meal is quick too.
  after(() => db().execute(sql`select 1`).catch(() => {}));
  // Keeps the other filters when removing the ingredient (or only its kind).
  const withoutIngredient = (keepIngredient: boolean) => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", String(categoryId));
    if (query) p.set("q", query);
    if (typeof sortParam === "string") p.set("sort", sortParam);
    if (keepIngredient) p.set("ingredient", ingredient);
    return p.size ? `/search?${p}` : "/search";
  };
  // A one-word search can be narrowed to meals that use it as an ingredient.
  const asIngredientHref =
    query && !ingredient && !/\s/.test(query)
      ? `/search?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), ingredient: query })}`
      : null;
  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-tight md:text-3xl">Search</h1>
        <RandomButton
          mealIds={meals.map((m) => m.id)}
          fallbackHref={categoryId ? `/random?category=${categoryId}` : "/random"}
        />
      </section>

      <section className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBox />
          </div>
          <SortSelect value={sort} />
        </div>
        <CategoryFilter categories={categories} counts={Object.fromEntries(counts)} activeId={categoryId} q={query} />
        {asIngredientHref && (
          <Link href={asIngredientHref} className="inline-flex text-sm font-medium text-emerald-700 hover:underline">
            🥕 Only meals with &quot;{query}&quot; as an ingredient
          </Link>
        )}
        {ingredient && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-stone-500">With</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-peach py-1.5 pr-1.5 pl-3 font-medium text-coral-ink">
              🥕 {ingredient}
              {variant && <span className="font-normal text-emerald-800">· {variant}</span>}
              <Link
                href={withoutIngredient(false)}
                aria-label="Remove ingredient filter"
                className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-800 hover:bg-emerald-200"
              >
                ✕
              </Link>
            </span>
            {variant && (
              <Link href={withoutIngredient(true)} className="font-medium text-emerald-700 hover:underline">
                Any {ingredient}
              </Link>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <p className="text-sm text-stone-500">
          {meals.length} meal{meals.length === 1 ? "" : "s"}
          {activeCategory && ` in ${activeCategory.emoji} ${activeCategory.name}`}
          {query && ` matching "${query}"`}
          {ingredient && ` with ${variant ? `${ingredient} (${variant})` : ingredient}`}
          {filtering && (
            <>
              {" · "}
              <Link href="/search" className="font-medium text-emerald-700 hover:underline">
                Clear
              </Link>
            </>
          )}
        </p>

        {meals.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <p className="text-stone-600">
              {query ? `Nothing found for "${query}".` : ingredient ? `No meals with ${ingredient} yet.` : categoryId ? "No meals in this category yet." : "No meals yet."}
            </p>
            {!query && !ingredient && (
              <Link href="/meals/new" className="btn-primary">
                Add your first favourite meal
              </Link>
            )}
          </div>
        ) : (
          <RecipeGrid meals={meals} showAuthor preload={4} />
        )}
      </section>
    </div>
  );
}
