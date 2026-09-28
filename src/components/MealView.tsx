import { AuthorLine } from "./AuthorLine";
import { CategoryChip } from "./CategoryChip";
import { MealImage } from "./MealImage";
import { MealMeta } from "./MealMeta";
import { formatQuantity, linkIcon, linkLabel } from "@/lib/meal-fields";
import type { MealWithCategories } from "@/lib/queries";

/** Photo, details, shopping list and steps; shared by the meal page and the public share page. */
export function MealView({ meal, actions }: { meal: MealWithCategories; actions?: React.ReactNode }) {
  const mainIngredients = meal.ingredients.filter((i) => !i.staple);
  const basics = meal.ingredients.filter((i) => i.staple);
  return (
    <>
      <div className="card overflow-hidden md:grid md:grid-cols-2">
        <MealImage src={meal.imageUrl} alt={meal.name} />
        <div className="flex flex-col gap-3 p-6">
          <div className="flex flex-wrap gap-1.5">
            {meal.categories.map((c) => (
              <CategoryChip key={c.id} category={c} showName />
            ))}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{meal.name}</h1>
          {meal.description && <p className="text-stone-600">{meal.description}</p>}
          <MealMeta meal={meal} detailed />
          <AuthorLine author={meal.author} createdAt={meal.createdAt} updatedAt={meal.updatedAt} />
          {actions && <div className="mt-auto flex flex-wrap gap-2 pt-4">{actions}</div>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card h-fit p-6 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">🛒 Shopping list</h2>
          {meal.ingredients.length === 0 ? (
            <p className="text-sm text-stone-500">No ingredients yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-stone-100 text-sm">
                {mainIngredients.map((item, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-center gap-3 py-2">
                      <input type="checkbox" className="peer h-4 w-4 accent-emerald-700" />
                      <span className="flex-1 peer-checked:text-stone-400 peer-checked:line-through">{item.name}</span>
                      <span className="text-stone-500 tabular-nums">{formatQuantity(item)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {basics.length > 0 && (
                <p className="mt-3 text-sm text-stone-500">
                  <span className="font-medium text-stone-600">🧂 Basics:</span>{" "}
                  {basics.map((b) => (formatQuantity(b) ? `${b.name} (${formatQuantity(b)})` : b.name)).join(", ")}
                </p>
              )}
            </>
          )}
        </section>

        <section className="card p-6 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">👩‍🍳 Steps</h2>
          {meal.steps.length === 0 ? (
            <p className="text-sm text-stone-500">No steps yet.</p>
          ) : (
            <ol className="space-y-4">
              {meal.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>
          )}
          {meal.links.length > 0 && (
            <div className="mt-6 border-t border-stone-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-stone-700">Sources</h3>
              <ul className="space-y-1.5">
                {meal.links.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-2 text-sm text-emerald-800 hover:underline"
                    >
                      <span>{linkIcon(l.url)}</span>
                      {linkLabel(l)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
