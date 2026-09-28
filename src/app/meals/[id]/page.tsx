import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMeal } from "@/app/actions/meals";
import { CategoryChip } from "@/components/CategoryChip";
import { EstimateButton } from "@/components/EstimateButton";
import { MealImage } from "@/components/MealImage";
import { NutritionForm } from "@/components/NutritionForm";
import { NutritionPanel } from "@/components/NutritionPanel";
import { SubmitButton } from "@/components/SubmitButton";
import { aiAvailable } from "@/lib/nutrients";
import { getMeal } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const meal = await getMeal(Number(id));
  if (!meal) notFound();
  const ai = aiAvailable();

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden md:flex">
        <MealImage src={meal.imageUrl} alt={meal.name} className="aspect-[4/3] md:w-2/5" />
        <div className="flex-1 space-y-3 p-6">
          <h1 className="text-3xl font-semibold">{meal.name}</h1>
          {meal.description && <p className="text-stone-600">{meal.description}</p>}
          <p className="text-sm text-stone-500">
            {meal.servings} serving{meal.servings === 1 ? "" : "s"}
            {meal.prepMinutes ? ` · ${meal.prepMinutes} min` : ""}
          </p>
          <div className="flex flex-wrap gap-1">
            {meal.categories.map((c) => (
              <CategoryChip key={c.id} category={c} />
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Link href={`/meals/${meal.id}/edit`} className="btn">
              Edit
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
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="mb-3 text-lg font-semibold">Shopping list</h2>
            {meal.ingredients.length ? (
              <ul className="space-y-1.5 text-sm">
                {meal.ingredients.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <input type="checkbox" className="mt-0.5" aria-label={item} />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">No ingredients listed.</p>
            )}
          </section>
          <section className="card p-6">
            <h2 className="mb-3 text-lg font-semibold">Instructions</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {meal.instructions || <span className="text-stone-500">No instructions yet.</span>}
            </div>
          </section>
        </div>

        <section className="card space-y-4 p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Nutrition per serving</h2>
            {ai && <EstimateButton mealId={meal.id} hasEstimate={!!meal.nutrition} />}
          </div>
          {meal.nutrition ? (
            <NutritionPanel nutrition={meal.nutrition} />
          ) : (
            <p className="text-sm text-stone-500">
              {ai
                ? "No values yet. Let the AI estimate calories, macros, fats, vitamins and minerals from the shopping list and cooking method, or enter them yourself."
                : "No values yet. Enter them below, for example from the package label or a nutrition app."}
            </p>
          )}
          <NutritionForm mealId={meal.id} nutrition={meal.nutrition} open={!ai && !meal.nutrition} />
        </section>
      </div>
    </div>
  );
}
