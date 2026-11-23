import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/v7/Icons";
import { RecipeGrid } from "@/components/v7/RecipeCards";
import { creatorOf } from "@/lib/creators";
import { avatarColors, initials } from "@/lib/look";
import { listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** A creator's profile: every recipe recreated from their posts. */
export default async function CreatorPage({ params }: PageProps<"/creators/[handle]">) {
  const handle = decodeURIComponent((await params).handle).toLowerCase();
  if (!/^[\w.]{1,30}$/.test(handle)) notFound();
  const meals = (await listMeals()).filter((m) => creatorOf(m.links)?.handle === handle);
  if (!meals.length) notFound();
  const [bg, fg] = avatarColors([...handle].reduce((n, c) => n + c.charCodeAt(0), 0));
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/feed" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full bg-sand">
          <Icon.back className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-extrabold tracking-tight">@{handle}</h1>
      </div>
      <section className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-extrabold" style={{ backgroundColor: bg, color: fg }}>
          {initials(handle)}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-ink2">
            {meals.length} recipe{meals.length === 1 ? "" : "s"} recreated from their posts. All credit to the creator.
          </p>
          <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noreferrer" className="text-sm font-bold underline">
            Open on Instagram ↗
          </a>
        </div>
      </section>
      <RecipeGrid meals={meals} preload={4} />
    </div>
  );
}
