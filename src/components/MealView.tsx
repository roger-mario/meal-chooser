import { AuthorLine } from "./AuthorLine";
import { CategoryChip } from "./CategoryChip";
import { MealImage } from "./MealImage";
import { MealMeta } from "./MealMeta";
import Link from "next/link";
import { formatQuantity, linkIcon, linkLabel } from "@/lib/meal-fields";
import type { MealWithCategories } from "@/lib/queries";

/** Photo, details, shopping list and steps; shared by the meal page and the public share page. */
export function MealView({
  meal,
  actions,
  ingredientLinks = false,
}: {
  meal: MealWithCategories;
  actions?: React.ReactNode;
  /** Link each ingredient's kind to the other meals using it (not on the public share page). */
  ingredientLinks?: boolean;
}) {
  const mainIngredients = meal.ingredients.filter((i) => !i.staple);
  const basics = meal.ingredients.filter((i) => i.staple);
  return (
    <>
      {/* Edge to edge on phones, a card on bigger screens. */}
      <div className="card -mx-4 -mt-5 overflow-hidden rounded-none border-x-0 border-t-0 sm:mx-0 sm:mt-0 sm:rounded-xl sm:border md:grid md:grid-cols-2">
        <MealImage src={meal.imageUrl} alt={meal.name} sizes="(min-width: 1024px) 512px, (min-width: 768px) 50vw, 100vw" preload />
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            {meal.categories.map((c) => (
              <CategoryChip key={c.id} category={c} showName />
            ))}
          </div>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">{meal.name}</h1>
          {meal.description && <p className="text-stone-600">{meal.description}</p>}
          <MealMeta meal={meal} detailed />
          <AuthorLine author={meal.author} createdAt={meal.createdAt} updatedAt={meal.updatedAt} />
          {actions && <div className="mt-auto flex flex-wrap gap-2 pt-2 *:flex-1 sm:pt-4 sm:*:flex-none">{actions}</div>}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <section className="card h-fit p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">🛒 Shopping list</h2>
          {meal.ingredients.length === 0 ? (
            <p className="text-sm text-stone-500">No ingredients yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-stone-100 text-sm">
                {mainIngredients.map((item, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-center gap-3 py-2.5 sm:py-2">
                      <input type="checkbox" className="peer h-5 w-5 shrink-0 accent-emerald-700 sm:h-4 sm:w-4" />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 peer-checked:text-stone-400 peer-checked:line-through">
                        {item.name}
                        {item.variant &&
                          (ingredientLinks ? (
                            <Link
                              href={`/?${new URLSearchParams({ ingredient: item.name, variant: item.variant })}`}
                              title={`Other meals with ${item.variant} ${item.name}`}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 hover:bg-emerald-100"
                            >
                              {item.variant}
                            </Link>
                          ) : (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{item.variant}</span>
                          ))}
                      </span>
                      <span className="text-stone-500 tabular-nums">{formatQuantity(item)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              {basics.length > 0 && (
                <p className="mt-3 text-sm text-stone-500">
                  <span className="font-medium text-stone-600">🧂 Basics:</span>{" "}
                  {basics
                    .map((b) => {
                      const details = [b.variant, formatQuantity(b)].filter(Boolean).join(", ");
                      return details ? `${b.name} (${details})` : b.name;
                    })
                    .join(", ")}
                </p>
              )}
            </>
          )}
        </section>

        <section className="card p-4 sm:p-6 lg:col-span-3">
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
