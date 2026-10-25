import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicHeader, PublicMealSections } from "@/components/PublicMeal";
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
      <PublicHeader badge="Shared recipe · view only" short="View only" />
      <main className="pb-safe mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5 sm:space-y-6 sm:py-8">
        <PublicMealSections meal={meal} />
      </main>
    </>
  );
}
