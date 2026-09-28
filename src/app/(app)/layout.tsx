import Link from "next/link";
import { AddCategoryButton } from "@/components/AddCategoryButton";
import { UserMenu } from "@/components/UserMenu";
import { WhoAreYou } from "@/components/WhoAreYou";
import { getCurrentUser, listUsers } from "@/lib/users";

const nav = [
  { href: "/cook", label: "🧺 What can I cook?" },
  { href: "/help", label: "❓ Help" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [users, current] = await Promise.all([listUsers(), getCurrentUser()]);
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
            <span className="text-2xl">🍲</span> Otao
          </Link>
          <nav className="order-last flex w-full gap-1 text-sm sm:order-none sm:w-auto">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AddCategoryButton />
            <Link href="/meals/new" className="btn-primary">
              + Meal
            </Link>
            {users.length > 0 && <UserMenu users={users} current={current} />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      {!current && users.length > 0 && <WhoAreYou users={users} />}
    </>
  );
}
