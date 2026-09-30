import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMeal } from "@/app/actions/meals";
import { MealForm } from "@/components/MealForm";
import { getMeal, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditMealPage({ params }: PageProps<"/meals/[id]/edit">) {
  const { id } = await params;
  const [meal, categories] = await Promise.all([getMeal(Number(id)), listCategories()]);
  if (!meal) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div>
        <Link href={`/meals/${meal.id}`} className="text-sm text-stone-500 hover:text-stone-800">
          ← Back to meal
        </Link>
        <h1 className="mt-1 text-2xl leading-tight font-semibold tracking-tight">Edit {meal.name}</h1>
      </div>
      <MealForm
        action={updateMeal.bind(null, meal.id)}
        categories={categories}
        initial={{
          name: meal.name,
          description: meal.description,
          imageUrl: meal.imageUrl,
          servings: meal.servings,
          prepMinutes: meal.prepMinutes,
          cookMinutes: meal.cookMinutes,
          difficulty: meal.difficulty,
          diet: meal.diet,
          babyFriendly: meal.babyFriendly,
          ingredients: meal.ingredients,
          steps: meal.steps,
          links: meal.links,
          categoryIds: meal.categories.map((c) => c.id),
        }}
      />
    </div>
  );
}
