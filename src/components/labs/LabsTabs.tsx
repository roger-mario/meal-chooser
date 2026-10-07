"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/labs", label: "Overview" },
  { href: "/labs/today", label: "📅 Today" },
  { href: "/labs/week", label: "🗓️ Week" },
  { href: "/labs/shopping", label: "🛒 Shopping" },
];

export function LabsTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1.5 text-sm whitespace-nowrap">
        {tabs.map((t) => {
          const active = t.href === "/labs" ? pathname === "/labs" : pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full px-3.5 font-medium transition ${
                  active ? "bg-violet-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
