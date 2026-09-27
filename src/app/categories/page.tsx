import { count, eq } from "drizzle-orm";
import { createCategory, deleteCategory, renameCategory } from "@/app/actions/categories";
import { SubmitButton } from "@/components/SubmitButton";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="text-sm text-stone-600">
        Group meals like &ldquo;Weekly meal&rdquo; or &ldquo;Baby dinner&rdquo;, then plan from a category.
      </p>

      <form action={createCategory} className="card flex items-end gap-3 p-4">
        <div className="flex-1">
          <label className="label" htmlFor="new-name">New category</label>
          <input id="new-name" name="name" required placeholder="Baby dinner" className="input" />
        </div>
        <input type="color" name="color" defaultValue="#16a34a" className="h-10 w-12 rounded" aria-label="Colour" />
        <SubmitButton>Add</SubmitButton>
      </form>

      <ul className="card divide-y divide-stone-100">
        {rows.length === 0 && <li className="p-4 text-sm text-stone-500">No categories yet.</li>}
        {rows.map(({ category: c, meals }) => (
          <li key={c.id} className="flex items-center gap-3 p-4">
            <form action={renameCategory.bind(null, c.id)} className="flex flex-1 items-center gap-3">
              <input type="color" name="color" defaultValue={c.color} className="h-9 w-10 rounded" aria-label="Colour" />
              <input name="name" defaultValue={c.name} className="input flex-1" aria-label="Name" />
              <span className="w-16 text-right text-xs text-stone-500">{meals} meals</span>
              <SubmitButton className="btn">Save</SubmitButton>
            </form>
            <form action={deleteCategory.bind(null, c.id)}>
              <SubmitButton className="btn-danger" pendingText="…">
                Delete
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
