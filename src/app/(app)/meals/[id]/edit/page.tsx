import Link from "next/link";
import { Icon } from "@/components/v7/Icons";
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
      <div className="flex items-center gap-3">
        <Link href={`/meals/${meal.id}`} aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand hover:bg-line">
          <Icon.back className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 text-[26px] leading-tight font-extrabold tracking-tight">Edit {meal.name}</h1>
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
