import Link from "next/link";
import { switchUser } from "@/app/actions/users";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/v7/Icons";
import { likedIds, listCollections } from "@/lib/library";
import { listMeals } from "@/lib/queries";
import { getCurrentUser, listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "You" };

const ROWS = [
  { href: "/cook", label: "What's at home", text: "Recipes you can cook with what you have", icon: Icon.fridge, tint: "bg-mint text-mint-ink" },
  { href: "/categories", label: "Categories", text: "Sort recipes your way", icon: Icon.tag, tint: "bg-butter text-butter-ink" },
  { href: "/labs", label: "Labs", text: "Week autopilot, food log, backups", icon: Icon.flask, tint: "bg-sky text-sky-ink" },
  { href: "/help", label: "Help", text: "How Otao works", icon: Icon.help, tint: "bg-sand text-ink2" },
  { href: "/privacy", label: "Privacy", text: "What we store and why", icon: Icon.shield, tint: "bg-sand text-ink2" },
];

export default async function YouPage() {
  const [me, all, everyone] = await Promise.all([getCurrentUser(), listMeals(), listUsers()]);
  const users = everyone.filter((u) => u.name !== "App Review");
  const [liked, cols] = me ? await Promise.all([likedIds(me.id), listCollections(me.id)]) : [[], []];
  const mine = me ? all.filter((m) => m.author?.id === me.id).length : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="flex items-center gap-4">
        <Avatar id={me?.id ?? null} name={me?.name ?? "?"} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[26px] font-extrabold tracking-tight">{me?.name ?? "Who are you?"}</h1>
          <p className="text-sm text-muted">
            {mine} recipe{mine === 1 ? "" : "s"} · {liked.length} liked · {cols.length} collection{cols.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <section className="card flex items-start gap-3 bg-sand/60 p-4">
        <Icon.shield className="mt-0.5 h-5 w-5 shrink-0 text-mint-ink" />
        <p className="text-sm text-ink2">
          Otao is invite-only for now. Your recipes stay private to your household unless you share one yourself.
        </p>
      </section>

      {cols.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-lg font-extrabold">Your collections</h2>
          <ul className="card divide-y divide-line">
            {cols.map((c) => (
              <li key={c.id}>
                <Link href={`/you/collections/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sand/50">
                  <Icon.stack className="h-5 w-5 text-coral-ink" />
                  <span className="flex-1 font-bold">{c.name}</span>
                  <span className="text-sm text-muted">{c.mealIds.length}</span>
                  <Icon.chevron className="h-4 w-4 text-off" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2.5">
        <h2 className="text-lg font-extrabold">More</h2>
        <ul className="card divide-y divide-line">
          {ROWS.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex items-center gap-3 px-4 py-3 hover:bg-sand/50">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${r.tint}`}>
                  <r.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{r.label}</span>
                  <span className="block truncate text-[13px] text-muted">{r.text}</span>
                </span>
                <Icon.chevron className="h-4 w-4 text-off" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {users.length > 1 && (
        <section className="space-y-2.5">
          <h2 className="text-lg font-extrabold">Using Otao as</h2>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <form key={u.id} action={switchUser.bind(null, u.id)}>
                <button className={`${me?.id === u.id ? "chip-on" : "chip"} h-11 pl-1.5`}>
                  <Avatar id={u.id} name={u.name} size="sm" /> {u.name}
                </button>
              </form>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
