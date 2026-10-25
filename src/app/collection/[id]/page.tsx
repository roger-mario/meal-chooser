import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader, PublicMealSections } from "@/components/PublicMeal";
import { getPublicMeal } from "@/lib/collection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/collection/[id]">): Promise<Metadata> {
  const meal = await getPublicMeal(Number((await params).id));
  return { title: meal ? `${meal.name} · Otao` : "Otao", robots: { index: false } };
}

// A public meal, read-only. Private meals are not found here, even with the right number.
export default async function CollectionMealPage({ params }: PageProps<"/collection/[id]">) {
  const meal = await getPublicMeal(Number((await params).id));
  if (!meal) notFound();

  return (
    <>
      <PublicHeader badge="Recipe collection · view only" short="View only" href="/collection" />
      <main className="pb-safe mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-5 sm:space-y-6 sm:py-8">
        <Link href="/collection" className="inline-flex min-h-10 items-center text-sm font-medium text-emerald-700 hover:underline">
          ← All recipes
        </Link>
        <PublicMealSections meal={meal} />
      </main>
    </>
  );
}
