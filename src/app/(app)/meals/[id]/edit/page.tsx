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
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Edit {meal.name}</h1>
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
