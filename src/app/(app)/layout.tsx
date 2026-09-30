import Link from "next/link";
import { AddCategoryButton } from "@/components/AddCategoryButton";
import { BottomNav } from "@/components/BottomNav";
import { UserMenu } from "@/components/UserMenu";
import { WhoAreYou } from "@/components/WhoAreYou";
import { getCurrentUser, listUsers } from "@/lib/users";

// Bigger screens get these in the header; phones get them in the tab bar at the bottom.
const nav = [
  { href: "/cook", label: "🧺 What can I cook?" },
  { href: "/categories", label: "🏷️ Categories" },
  { href: "/help", label: "❓ Help" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [users, current] = await Promise.all([listUsers(), getCurrentUser()]);
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-5 px-4 sm:h-16">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
            <span className="text-2xl">🍲</span> Otao
          </Link>
          <nav className="hidden gap-1 text-sm whitespace-nowrap md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:contents">
              <AddCategoryButton />
            </span>
            <Link href="/meals/new" className="btn-primary hidden md:inline-flex">
              + Meal
            </Link>
            {users.length > 0 && <UserMenu users={users} current={current} />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:py-8">{children}</main>
      <BottomNav />
      {!current && users.length > 0 && <WhoAreYou users={users} />}
    </>
  );
}
