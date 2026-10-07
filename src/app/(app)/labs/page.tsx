import Link from "next/link";
import { LabsToggle } from "@/components/labs/LabsToggle";
import { labsEnabled } from "@/lib/labs-queries";

export const dynamic = "force-dynamic";

const EXPERIMENTS = [
  {
    href: "/labs/today",
    emoji: "📅",
    title: "Today & smart dinner",
    text: "Log breakfast, lunch and snacks in a tap. Otao adds up what you've had and suggests a dinner from your meals that fills what's still missing (vitamins, fibre, protein …).",
  },
  {
    href: "/labs/week",
    emoji: "🗓️",
    title: "Week autopilot & weekly check",
    text: "Set a few rules once (time on weekdays, fish, baby-friendly, budget) and let Otao draft the next 7 dinners. Swap what you don't like. The weekly check shows fibre, plant variety and gaps.",
  },
  {
    href: "/labs/shopping",
    emoji: "🛒",
    title: "One shopping list for many meals",
    text: "Tick a few meals, get one merged list (same ingredients added up, basics left out) and send it to Bring! in one go.",
  },
];

export default async function LabsPage() {
  const on = await labsEnabled();
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600 sm:text-base">
        New ideas to try before they become part of Otao. They may change or disappear, and nothing here changes your meals.
        Tell us in the chat what works and what doesn&apos;t.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {EXPERIMENTS.map((e) => (
          <li key={e.href}>
            <Link href={e.href} className="card flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="text-3xl">{e.emoji}</span>
              <span className="font-semibold text-stone-900">{e.title}</span>
              <span className="text-sm text-stone-600">{e.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="card p-4 text-sm">
        <LabsToggle on={on} />
      </div>
    </div>
  );
}
