import { sql } from "drizzle-orm";
import Link from "next/link";
import { after } from "next/server";
import { db } from "@/db";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MealCard } from "@/components/MealCard";
import { RandomButton } from "@/components/RandomButton";
import { SearchBox } from "@/components/SearchBox";
import { SortSelect } from "@/components/SortSelect";
import { formatDay, todayISO } from "@/lib/dates";
import { parseSort, sortMeals } from "@/lib/meal-sort";
import { categoryCounts, commentCounts, listCategories, listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: process.env.APP_TIMEZONE || "UTC" }).format(
      new Date(),
    ),
  );
  if (hour < 11) return "Good morning";
  if (hour < 17) return "Hi";
  return "Good evening";
}

export default async function MealsPage({ searchParams }: PageProps<"/">) {
  const { category, q, ingredient: ingredientParam, variant: variantParam, sort: sortParam } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const query = typeof q === "string" ? q.trim() : "";
  const ingredient = typeof ingredientParam === "string" ? ingredientParam.trim().slice(0, 80) : "";
  const variant = ingredient && typeof variantParam === "string" ? variantParam.trim().slice(0, 80) : "";
  const sort = parseSort(sortParam);
  const today = todayISO();
  const [found, categories, counts, chats, me] = await Promise.all([
    listMeals({ categoryId, q: query, ingredient, variant }),
    listCategories(),
    categoryCounts(),
    commentCounts(),
    getCurrentUser(),
  ]);
  const meals = sortMeals(found, sort);
  // The lists above come from the cache. Wake the database now so opening a meal is quick too.
  after(() => db().execute(sql`select 1`).catch(() => {}));
  const filtering = Boolean(query || categoryId || ingredient);
  // Keeps the other filters when removing the ingredient (or only its kind).
  const withoutIngredient = (keepIngredient: boolean) => {
    const p = new URLSearchParams();
    if (categoryId) p.set("category", String(categoryId));
    if (query) p.set("q", query);
    if (typeof sortParam === "string") p.set("sort", sortParam);
    if (keepIngredient) p.set("ingredient", ingredient);
    return p.size ? `/?${p}` : "/";
  };
  // A one-word search can be narrowed to meals that use it as an ingredient.
  const asIngredientHref =
    query && !ingredient && !/\s/.test(query)
      ? `/?${new URLSearchParams({ ...(categoryId ? { category: String(categoryId) } : {}), ingredient: query })}`
      : null;
  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-stone-500">{formatDay(today, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}
            {me ? `, ${me.name}` : ""} 👋
          </h1>
        </div>
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 py-1.5 pr-1.5 pl-3 font-medium text-emerald-900">
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
              <Link href="/" className="font-medium text-emerald-700 hover:underline">
                Clear
              </Link>
            </>
          )}
        </p>

        {meals.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="text-5xl">🍲</span>
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
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {meals.map((m, i) => (
              <li key={m.id}>
                <MealCard meal={m} comments={chats.get(m.id) ?? 0} preload={i < 4} />
              </li>
            ))}
            {!filtering && (
              <li className="hidden sm:block">
                <Link
                  href="/meals/new"
                  className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 p-6 text-center text-stone-500 transition hover:border-emerald-600 hover:text-emerald-700"
                >
                  <span className="text-3xl">＋</span>
                  <span className="text-sm font-medium">Add a meal</span>
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
