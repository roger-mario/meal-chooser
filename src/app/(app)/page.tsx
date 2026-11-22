import { sql } from "drizzle-orm";
import Link from "next/link";
import { after } from "next/server";
import { db } from "@/db";
import { Dish } from "@/components/v7/Dish";
import { Icon } from "@/components/v7/Icons";
import { PlanStrip, type StripDay } from "@/components/v7/PlanStrip";
import { RecipeCarousel, RecipeGrid } from "@/components/v7/RecipeCards";
import { Tabs } from "@/components/v7/Tabs";
import { WaveBanner } from "@/components/v7/WaveBanner";
import { currentHour } from "@/lib/dates";
import { likeCounts, likedIds, listCollections } from "@/lib/library";
import { chf, onSky, pickGreeting, tileFor } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import { planDays } from "@/lib/plan-view";
import { listMeals, type MealWithCategories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [all, me, likes] = await Promise.all([listMeals(), getCurrentUser(), likeCounts()]);
  const [days, liked, cols] = await Promise.all([
    planDays(all, 7),
    me ? likedIds(me.id) : Promise.resolve([]),
    me ? listCollections(me.id) : Promise.resolve([]),
  ]);
  // The lists above come from the cache. Wake the database now so opening a recipe is quick too.
  after(() => db().execute(sql`select 1`).catch(() => {}));

  const byId = new Map(all.map((m) => [m.id, m]));
  const mine = me ? all.filter((m) => m.author?.id === me.id) : all;
  const likedMeals = liked.map((id) => byId.get(id)).filter((m): m is MealWithCategories => !!m);
  const likedSet = new Set(liked);
  const planned = new Set(days.flatMap((d) => d.entries.map((e) => e.meal?.id)));
  const rank = (m: MealWithCategories) => (likes.get(m.id) ?? 0) * 12 + (mealFacts(m).score ?? 45) + (planned.has(m.id) ? -40 : 0);
  const others = all.filter((m) => !me || (m.author?.id !== me.id && !likedSet.has(m.id)));
  const picks = (others.length >= 3 ? others : all).toSorted((a, b) => rank(b) - rank(a)).slice(0, 8);

  const strip = (d: (typeof days)[number]): StripDay => ({
    day: d.day,
    label: d.long,
    meals: d.entries.map((e) => {
      const f = e.meal ? mealFacts(e.meal) : null;
      return {
        id: e.id,
        slot: e.slot,
        name: e.meal?.name ?? e.label ?? "",
        meta: f ? [f.time, f.kcal ? `${f.kcal} kcal` : null, chf(f.chf)].filter(Boolean).join(" · ") : "",
        href: e.meal ? `/meals/${e.meal.id}` : null,
        art: e.meal ? <Dish meal={e.meal} className="h-full w-full" sizes="56px" /> : <span className="block h-full w-full bg-sand" />,
      };
    }),
  });
  const week = days.map((d) => ({ day: d.day, short: d.short, isToday: d.isToday, text: d.entries.map((e) => e.meal?.name ?? e.label).join(", ") }));

  const empty = (text: string, cta?: React.ReactNode) => (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="text-muted">{text}</p>
      {cta}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3 md:hidden">
        <h1 className="min-w-0 flex-1 text-[26px] leading-tight font-extrabold tracking-tight">{pickGreeting(me?.name.split(" ")[0] ?? null, currentHour())}</h1>
        <Link href="/meals/new" aria-label="Add a recipe" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-ink">
          <Icon.plus className="h-5 w-5" />
        </Link>
      </section>
      <h1 className="hidden text-3xl font-extrabold tracking-tight md:block">{pickGreeting(me?.name.split(" ")[0] ?? null, currentHour())}</h1>

      <PlanStrip today={strip(days[0])} tomorrow={strip(days[1])} week={week} />

      <WaveBanner
        title="Otao suggests"
        text={picks.length ? "Healthy picks from your household and friends, based on what you like." : "Add a few recipes and Otao starts suggesting."}
        href="/feed"
        panel={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight">Your recipes</h2>
              <Link href="/search" className="flex items-center gap-1.5 text-sm font-bold text-coral-ink hover:underline">
                <Icon.search className="h-4 w-4" /> Search
              </Link>
            </div>
            <Tabs
              tabs={[
                {
                  label: "Mine",
                  count: mine.length,
                  panel: mine.length
                    ? <RecipeGrid meals={mine} preload={4} />
                    : empty("You haven't added a recipe yet.", <Link href="/meals/new" className="btn-primary">Add your first recipe</Link>),
                },
                {
                  label: "Liked",
                  count: likedMeals.length,
                  panel: likedMeals.length ? <RecipeGrid meals={likedMeals} showAuthor /> : empty("Tap the heart on a recipe to keep it here."),
                },
                {
                  label: "Collections",
                  count: cols.length,
                  panel: cols.length ? (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {cols.map((c) => {
                        const cover = c.mealIds.map((id) => byId.get(id)).filter((m): m is MealWithCategories => !!m).slice(0, 4);
                        return (
                          <li key={c.id}>
                            <Link href={`/you/collections/${c.id}`} className="group block">
                              <div className="grid aspect-[4/3] grid-cols-2 gap-0.5 overflow-hidden rounded-[18px] bg-sand transition group-hover:brightness-95">
                                {cover.map((m) => (
                                  <Dish key={m.id} meal={m} className={cover.length === 1 ? "col-span-2 row-span-2" : ""} sizes="120px" />
                                ))}
                              </div>
                              <p className="mt-2 truncate text-[15px] font-bold">{c.name}</p>
                              <p className="text-xs text-muted">
                                {c.mealIds.length} recipe{c.mealIds.length === 1 ? "" : "s"}
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    empty("Group recipes into collections like “Weekly meals” from a recipe’s page.")
                  ),
                },
              ]}
            />
          </div>
        }
      >
        {picks.length > 0 && <RecipeCarousel meals={picks} tileFor={(m) => onSky(tileFor(m.id))} />}
      </WaveBanner>
    </div>
  );
}
