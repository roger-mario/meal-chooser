import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/v7/Icons";
import { RecipeGrid } from "@/components/v7/RecipeCards";
import { listCollections } from "@/lib/library";
import { listMeals, type MealWithCategories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/** One of your own collections. */
export default async function CollectionPage({ params }: PageProps<"/you/collections/[id]">) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) notFound();
  const [cols, all] = await Promise.all([listCollections(me.id), listMeals()]);
  const c = cols.find((x) => x.id === Number(id));
  if (!c) notFound();
  const byId = new Map(all.map((m) => [m.id, m]));
  const meals = c.mealIds.map((mid) => byId.get(mid)).filter((m): m is MealWithCategories => !!m);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/you" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full bg-sand">
          <Icon.back className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-[26px] font-extrabold tracking-tight">{c.name}</h1>
      </div>
      {meals.length ? <RecipeGrid meals={meals} showAuthor preload={4} /> : <p className="text-muted">No recipes in this collection yet.</p>}
    </div>
  );
}
