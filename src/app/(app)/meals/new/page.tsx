import Link from "next/link";
import { Icon } from "@/components/v7/Icons";
import { createMeal } from "@/app/actions/meals";
import { MealForm } from "@/components/MealForm";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const categories = await listCategories();
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand hover:bg-line">
          <Icon.back className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 text-[26px] font-extrabold tracking-tight md:text-3xl">New recipe</h1>
      </div>
      <MealForm action={createMeal} categories={categories} />
    </div>
  );
}
