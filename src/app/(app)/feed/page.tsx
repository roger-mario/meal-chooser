import Link from "next/link";
import { AddToPlan } from "@/components/v7/AddToPlan";
import { Dish, ScoreChip } from "@/components/v7/Dish";
import { LikeButton } from "@/components/v7/LikeButton";
import { formatDay, todayISO } from "@/lib/dates";
import { addDays } from "@/lib/labs";
import { likeCounts, likedIds } from "@/lib/library";
import { avatarColors, chf, initials, tileFor } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import { listMeals } from "@/lib/queries";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feed" };

/** Everyone's recipes, one big card at a time, like a reel. */
export default async function FeedPage() {
  const [all, me, likes] = await Promise.all([listMeals(), getCurrentUser(), likeCounts()]);
  const liked = new Set(me ? await likedIds(me.id) : []);
  // Other people's recipes first (newest first), then your own.
  const meals = [...all.filter((m) => m.author?.id !== me?.id), ...all.filter((m) => me && m.author?.id === me.id)];
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    return { day, label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDay(day, { day: undefined, month: undefined }) };
  });

  if (!meals.length)
    return (
      <div className="card mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-muted">No recipes in the feed yet.</p>
        <Link href="/meals/new" className="btn-primary">
          Add a recipe
        </Link>
      </div>
    );

  return (
    <div className="no-scrollbar -mx-4 -mt-[calc(env(safe-area-inset-top)+14px)] h-[100dvh] snap-y snap-mandatory overflow-y-auto md:mx-auto md:mt-0 md:h-[calc(100dvh-64px-48px)] md:max-w-[440px] md:rounded-[28px]">
      {meals.map((m, i) => {
        const f = mealFacts(m);
        const [bg, fg] = avatarColors(m.author?.id ?? 0);
        const n = likes.get(m.id) ?? 0;
        // White text over a dark fade on photos, ink text straight on the pastel tile otherwise.
        const photo = !!m.imageUrl;
        return (
          <article key={m.id} className="relative h-full snap-start snap-always overflow-hidden md:mb-4 md:rounded-[28px]" style={{ backgroundColor: tileFor(m.id) }}>
            {/* Photos fill the card; an illustration sits in the top part on its pastel tile. */}
            <div className={m.imageUrl ? "absolute inset-0" : "absolute inset-x-0 top-[8%] aspect-[4/3]"}>
              <Dish meal={m} className="h-full w-full" sizes="(min-width: 768px) 440px, 100vw" preload={i < 2} />
            </div>
            {photo && <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />}
            <ScoreChip score={f.score} className="absolute top-[calc(env(safe-area-inset-top)+16px)] left-4 md:top-4" />
            <div className="absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+120px)] flex flex-col items-center gap-1 md:bottom-28">
              <LikeButton mealId={m.id} on={liked.has(m.id)} />
              {n > 0 && <span className={`text-xs font-bold ${photo ? "text-white" : "text-ink"}`}>{n}</span>}
            </div>
            <div className={`absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+100px)] space-y-3 px-4 md:bottom-5 ${photo ? "text-white" : "text-ink"}`}>
              {m.author && (
                <p className="flex items-center gap-2 text-sm font-bold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold" style={{ backgroundColor: bg, color: fg }}>
                    {initials(m.author.name)}
                  </span>
                  {m.author.name}
                </p>
              )}
              <Link href={`/meals/${m.id}`} className="block pr-16">
                <h2 className="text-[26px] leading-tight font-extrabold tracking-tight">{m.name}</h2>
                <p className={`mt-1 text-sm ${photo ? "text-white/85" : "text-ink2"}`}>{[f.time, f.kcal ? `${f.kcal} kcal` : null, chf(f.chf)].filter(Boolean).join(" · ")}</p>
              </Link>
              <div className="flex gap-2">
                <AddToPlan mealId={m.id} days={days} compact />
                <Link href={`/meals/${m.id}`} className="btn h-12 bg-white/95">
                  Recipe
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
