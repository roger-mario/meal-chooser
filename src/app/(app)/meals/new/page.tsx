import Link from "next/link";
import { createMeal } from "@/app/actions/meals";
import { MealForm } from "@/components/MealForm";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const categories = await listCategories();
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          ← Meals
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New meal</h1>
      </div>
      <MealForm action={createMeal} categories={categories} />
    </div>
  );
}
