import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { FloatingNav, HeaderNav } from "@/components/v7/FloatingNav";
import { Icon } from "@/components/v7/Icons";
import { Wordmark } from "@/components/v7/Logo";
import { WhoAreYou } from "@/components/WhoAreYou";
import { getCurrentUser, listUsers } from "@/lib/users";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [all, current] = await Promise.all([listUsers(), getCurrentUser()]);
  // The App Store reviewer's account only exists for the iPhone app.
  const users = all.filter((u) => u.name !== "App Review");
  return (
    <>
      {/* Phones get the floating tab bar at the bottom instead of this header. */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-bg/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <Link href="/" aria-label="Otao home" className="shrink-0">
            <Wordmark size={22} />
          </Link>
          <HeaderNav />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/meals/new" className="btn-primary h-10 min-h-10 px-4">
              <Icon.plus className="h-4 w-4" /> Add a recipe
            </Link>
            {users.length > 0 && <UserMenu users={users} current={current} />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-32 md:px-6 md:pt-8 md:pb-16">{children}</main>
      <FloatingNav />
      {!current && users.length > 0 && <WhoAreYou users={users} />}
    </>
  );
}
