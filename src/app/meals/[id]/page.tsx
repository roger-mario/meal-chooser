import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMeal } from "@/app/actions/meals";
import { CategoryChip } from "@/components/CategoryChip";
import { EstimateButton } from "@/components/EstimateButton";
import { MealImage } from "@/components/MealImage";
import { MealMeta } from "@/components/MealMeta";
import { NutritionForm } from "@/components/NutritionForm";
import { NutritionPanel } from "@/components/NutritionPanel";
import { SubmitButton } from "@/components/SubmitButton";
import { formatQuantity } from "@/lib/meal-fields";
import { aiAvailable } from "@/lib/nutrients";
import { getMeal } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const meal = await getMeal(Number(id));
  if (!meal) notFound();
  const ai = aiAvailable();
  const mainIngredients = meal.ingredients.filter((i) => !i.staple);
  const basics = meal.ingredients.filter((i) => i.staple);

  return (
    <div className="space-y-6">
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
          <div className="mt-auto flex gap-2 pt-4">
            <Link href={`/meals/${meal.id}/edit`} className="btn">
              ✏️ Edit
            </Link>
            <form action={deleteMeal.bind(null, meal.id)}>
              <SubmitButton className="btn-danger" pendingText="Deleting…">
                Delete
              </SubmitButton>
            </form>
          </div>
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
        </section>
      </div>

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">🥗 Nutrition per serving</h2>
          {ai && <EstimateButton mealId={meal.id} hasEstimate={!!meal.nutrition} />}
        </div>
        {meal.nutrition ? (
          <NutritionPanel nutrition={meal.nutrition} />
        ) : (
          <p className="text-sm text-stone-500">
            {ai
              ? "No values yet. Let the AI estimate calories, macros, vitamins and minerals, or enter them yourself."
              : "No values yet. Enter them below, for example from a package label or a nutrition app."}
          </p>
        )}
        <NutritionForm mealId={meal.id} nutrition={meal.nutrition} />
      </section>
    </div>
  );
}
