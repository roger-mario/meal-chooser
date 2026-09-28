import Link from "next/link";
import { CategoryChip } from "@/components/CategoryChip";
import { CategoryFilter } from "@/components/CategoryFilter";
import { MealImage } from "@/components/MealImage";
import { MealMeta } from "@/components/MealMeta";
import { listCategories, listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealsPage({ searchParams }: PageProps<"/">) {
  const { category } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const [meals, categories] = await Promise.all([listMeals(categoryId), listCategories()]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Your meals</h1>
        <CategoryFilter categories={categories} activeId={categoryId} />
      </div>

      {meals.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <span className="text-5xl">🍲</span>
          <p className="text-stone-600">{categoryId ? "No meals in this category yet." : "No meals yet."}</p>
          <Link href="/meals/new" className="btn-primary">
            Add your first favourite meal
          </Link>
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
