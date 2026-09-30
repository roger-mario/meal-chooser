import { count, eq } from "drizzle-orm";
import { AddCategoryButton } from "@/components/AddCategoryButton";
import { EditCategoryRow } from "@/components/EditCategoryRow";
import { categories, db, mealCategories } from "@/db";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const rows = await db()
    .select({ category: categories, meals: count(mealCategories.mealId) })
    .from(categories)
    .leftJoin(mealCategories, eq(mealCategories.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return (
    <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-stone-500">Tag meals to find them quickly, e.g. Weekly meal or Baby dinner.</p>
        </div>
        <AddCategoryButton className="btn-primary shrink-0" />
      </div>
      <ul className="card divide-y divide-stone-100">
        {rows.length === 0 && <li className="p-6 text-sm text-stone-500">No categories yet.</li>}
        {rows.map(({ category, meals }) => (
          <EditCategoryRow key={category.id} category={category} meals={meals} />
        ))}
      </ul>
    </div>
  );
}
