import Image from "next/image";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MealCard } from "@/components/MealCard";
import { SearchBox } from "@/components/SearchBox";
import { SortSelect } from "@/components/SortSelect";
import { formatDay, todayISO } from "@/lib/dates";
import { parseSort, sortMeals } from "@/lib/meal-sort";
import { categoryCounts, commentCounts, listCategories, listMeals, planForDay } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

const SLOT_EMOJI = { breakfast: "🍳", lunch: "🥪", dinner: "🍝", snack: "🍎" } as const;

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
  const { category, q, sort: sortParam } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const query = typeof q === "string" ? q.trim() : "";
  const sort = parseSort(sortParam);
  const today = todayISO();
  const [found, categories, counts, chats, plan, me] = await Promise.all([
    listMeals({ categoryId, q: query }),
    listCategories(),
    categoryCounts(),
    commentCounts(),
    planForDay(today),
    getCurrentUser(),
  ]);
  const meals = sortMeals(found, sort);
  const filtering = Boolean(query || categoryId);
  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-stone-500">{formatDay(today, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting()}
              {me ? `, ${me.name}` : ""} 👋
            </h1>
          </div>
          <Link href={categoryId ? `/random?category=${categoryId}` : "/random"} className="btn" prefetch={false}>
            🎲 Surprise me
          </Link>
        </div>

        <div className="card flex items-center gap-3 overflow-x-auto p-3">
          <Link href="/plan" className="shrink-0 rounded-lg px-2 text-sm font-semibold whitespace-nowrap text-stone-700 hover:text-emerald-700">
            📅 Today
          </Link>
          {plan.length === 0 ? (
            <p className="text-sm text-stone-500">
              Nothing planned yet.{" "}
              <Link href="/plan" className="font-medium text-emerald-700 hover:underline">
                Plan your meals →
              </Link>
            </p>
          ) : (
            plan.map((e) => (
              <Link
                key={e.slot}
                href={`/meals/${e.mealId}`}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 py-1 pr-3 pl-1 hover:border-emerald-600"
              >
                <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-amber-50 text-lg">
                  {e.imageUrl ? (
                    <Image src={e.imageUrl} alt="" fill sizes="36px" className="object-cover" unoptimized={e.imageUrl.startsWith("/")} />
                  ) : (
                    SLOT_EMOJI[e.slot]
                  )}
                </span>
                <span className="leading-tight">
                  <span className="block text-[11px] text-stone-500 capitalize">{e.slot}</span>
                  <span className="block max-w-44 truncate text-sm font-medium">{e.name}</span>
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBox />
          </div>
          <SortSelect value={sort} />
        </div>
        <CategoryFilter categories={categories} counts={Object.fromEntries(counts)} activeId={categoryId} q={query} />
      </section>

      <section className="space-y-3">
        <p className="text-sm text-stone-500">
          {meals.length} meal{meals.length === 1 ? "" : "s"}
          {activeCategory && ` in ${activeCategory.emoji} ${activeCategory.name}`}
          {query && ` matching "${query}"`}
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
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {meals.map((m) => (
              <li key={m.id}>
                <MealCard meal={m} comments={chats.get(m.id) ?? 0} />
              </li>
            ))}
            {!filtering && (
              <li>
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
