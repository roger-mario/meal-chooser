"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = "h-6 w-6";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const tabs = [
  {
    href: "/",
    label: "Meals",
    match: (p: string) => p === "/" || (p.startsWith("/meals/") && p !== "/meals/new"),
    icon: (
      <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/cook",
    label: "Cook",
    match: (p: string) => p.startsWith("/cook"),
    icon: (
      <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden>
        <path d="M3 10h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8z" />
        <path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3" />
      </svg>
    ),
  },
  { href: "/meals/new", label: "Add", match: (p: string) => p === "/meals/new", icon: null },
  {
    href: "/categories",
    label: "Categories",
    match: (p: string) => p.startsWith("/categories"),
    icon: (
      <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden>
        <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
        <circle cx="8" cy="8" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/help",
    label: "Help",
    match: (p: string) => p.startsWith("/help"),
    icon: (
      <svg viewBox="0 0 24 24" className={icon} {...stroke} aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
      </svg>
    ),
  },
];

/** App-style tab bar on phones. Hidden on the meal form, which has its own save bar. */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/meals/new" || pathname.endsWith("/edit")) return null;

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden />
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map((t) => {
            const active = t.match(pathname);
            if (!t.icon) {
              return (
                <li key={t.href} className="flex justify-center">
                  <Link
                    href={t.href}
                    aria-label="Add a meal"
                    className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg ring-4 ring-stone-50 transition active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7" {...stroke} strokeWidth={2.2} aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </Link>
                </li>
              );
            }
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition ${
                    active ? "text-emerald-700" : "text-stone-500 active:text-stone-800"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
