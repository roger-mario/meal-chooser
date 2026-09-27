import Link from "next/link";
import { CategoryChip } from "@/components/CategoryChip";
import { MealImage } from "@/components/MealImage";
import { listCategories, listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealsPage({ searchParams }: PageProps<"/">) {
  const { category } = await searchParams;
  const categoryId = category ? Number(category) : undefined;
  const [meals, categories] = await Promise.all([listMeals(categoryId), listCategories()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-2xl font-semibold">Meals</h1>
        <Link href="/" className={!categoryId ? "btn-primary" : "btn"}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/?category=${c.id}`} className={categoryId === c.id ? "btn-primary" : "btn"}>
            {c.name}
          </Link>
        ))}
      </div>

      {meals.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">
          No meals yet.{" "}
          <Link href="/meals/new" className="text-emerald-700 underline">
            Add your first favourite meal
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((m) => (
            <li key={m.id}>
              <Link href={`/meals/${m.id}`} className="card block overflow-hidden transition hover:shadow-md">
                <MealImage src={m.imageUrl} alt={m.name} className="aspect-[4/3]" />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold">{m.name}</h2>
                    {m.nutrition && (
                      <span className="shrink-0 text-sm text-stone-500">
                        {Math.round(m.nutrition.perServing.calories)} kcal
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {m.categories.map((c) => (
                      <CategoryChip key={c.id} category={c} />
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
