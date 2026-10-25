import Link from "next/link";
import { MealCard } from "@/components/MealCard";
import { SearchBox } from "@/components/SearchBox";
import { listPublicMeals, quickPicks } from "@/lib/collection";
import { listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function LabsCollectionPage({ searchParams }: PageProps<"/labs/collection">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const [publicMeals, all, me] = await Promise.all([listPublicMeals({ q: query }), listMeals(), getCurrentUser()]);
  const picks = me ? await quickPicks(me.id, all) : [];

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600 sm:text-base">
        Meals are private unless the person who added them taps <b>🔒 Private</b> on the meal page to make them{" "}
        <b>🌍 Public</b>. Public meals are listed here and on the{" "}
        <Link href="/collection" className="font-medium text-emerald-700 hover:underline">
          public collection page
        </Link>
        , which anyone can open without the password.
      </p>

      <section className="space-y-3">
        <h2 className="font-semibold">⭐ Your quick picks</h2>
        {!me ? (
          <p className="text-sm text-stone-500">Pick who you are at the top right to see your quick picks.</p>
        ) : picks.length === 0 ? (
          <p className="text-sm text-stone-500">
            Star meals with ☆ Favourite, or just open, eat and chat about meals: the ones you come back to show up here.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {picks.map((m) => (
              <li key={m.id}>
                <MealCard meal={m} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">🌍 Public collection</h2>
        <SearchBox />
        {publicMeals.length === 0 ? (
          <p className="text-sm text-stone-500">{query ? `No public meals match "${query}".` : "No public meals yet."}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {publicMeals.map((m) => (
              <li key={m.id}>
                <MealCard meal={m} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
