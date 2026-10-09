import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CostPanel } from "@/components/CostPanel";
import { MealView } from "@/components/MealView";
import { NutritionPanel } from "@/components/NutritionPanel";
import { HealthSummary } from "@/components/HealthSummary";
import { getSharedMeal } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/s/[token]">): Promise<Metadata> {
  const meal = await getSharedMeal((await params).token);
  return {
    title: meal ? `${meal.name} · Otao` : "Otao",
    robots: { index: false },
  };
}

// Public, read-only view of a meal someone shared. No editing, no navigation into the app.
export default async function SharedMealPage({ params }: PageProps<"/s/[token]">) {
  const { token } = await params;
  const meal = await getSharedMeal(token);
  if (!meal) notFound();

  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 text-lg font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" /> Otao
          <span className="ml-auto rounded-full bg-stone-100 px-3 py-1 text-xs font-normal text-stone-500">
            <span className="sm:hidden">View only</span><span className="hidden sm:inline">Shared recipe · view only</span>
          </span>
        </div>
      </header>
      <main className="pb-safe mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5 sm:space-y-6 sm:py-8">
        <MealView meal={meal} />
        {meal.nutrition && (
          <section className="card space-y-3 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">✨ Otao score</h2>
            <HealthSummary nutrition={meal.nutrition} />
          </section>
        )}
        {meal.cost && meal.cost.items.length > 0 && (
          <section className="card space-y-4 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">💰 Cost at {meal.cost.store}</h2>
            <CostPanel cost={meal.cost} servings={meal.servings} />
          </section>
        )}
        {meal.nutrition && (
          <section className="card space-y-4 p-4 sm:p-6">
            <h2 className="text-lg font-semibold">🥗 Nutrition per serving</h2>
            <NutritionPanel nutrition={meal.nutrition} />
          </section>
        )}
      </main>
    </>
  );
}
