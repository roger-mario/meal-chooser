import { createMeal } from "@/app/actions/meals";
import { MealForm } from "@/components/MealForm";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const categories = await listCategories();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">New meal</h1>
      <MealForm action={createMeal} categories={categories} />
    </div>
  );
}
