"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

export const TABS = [
  { href: "/", label: "Home", icon: Icon.home, match: (p: string) => p === "/" },
  { href: "/feed", label: "Feed", icon: Icon.feed, match: (p: string) => p.startsWith("/feed") },
  { href: "/plan", label: "Plan", icon: Icon.plan, match: (p: string) => p.startsWith("/plan") || p.startsWith("/labs/week") || p.startsWith("/labs/shopping") },
  { href: "/search", label: "Search", icon: Icon.search, match: (p: string) => p.startsWith("/search") },
  { href: "/you", label: "You", icon: Icon.you, match: (p: string) => p.startsWith("/you") || p.startsWith("/cook") || p.startsWith("/categories") || p.startsWith("/help") || p === "/labs" },
] as const;

// Full-screen forms bring their own save bar, so the tab bar steps aside there.
const HIDDEN = (p: string) => p === "/meals/new" || p.endsWith("/edit");

/** Phones: a floating, rounded tab bar that gets a touch smaller while you scroll down. */
export function FloatingNav() {
  const path = usePathname();
  const [compact, setCompact] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last.current;
      last.current = y;
      if (y < 24) setCompact(false);
      else if (dy > 6) setCompact(true);
      else if (dy < -6) setCompact(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (HIDDEN(path)) return null;
  return (
    <nav aria-label="Main" className="pointer-events-none fixed inset-x-0 z-30 flex justify-center md:hidden" style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}>
      <div
        className="pointer-events-auto flex h-16 w-[92%] max-w-[420px] items-center rounded-full border border-line bg-white/95 px-1.5 shadow-[0_6px_18px_rgba(42,38,34,0.14)] backdrop-blur transition-transform duration-300 ease-out"
        style={{ transform: compact ? "translateY(6px) scale(0.88)" : "none" }}
      >
        {TABS.map((t) => {
          const on = t.match(path);
          const Glyph = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={on ? "page" : undefined}
              className={`flex h-[50px] flex-1 items-center justify-center rounded-full transition ${on ? "bg-peach text-coral-ink" : "text-ink"}`}
            >
              <Glyph className="h-[26px] w-[26px]" strokeWidth={on ? 2.3 : 1.9} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Bigger screens: the same five places as links in the header. */
export function HeaderNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {TABS.map((t) => {
        const on = t.match(path);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${on ? "bg-peach text-coral-ink" : "text-ink2 hover:bg-sand"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
