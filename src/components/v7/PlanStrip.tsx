"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { fillDay } from "@/app/actions/plan";
import { Icon } from "./Icons";

export type StripMeal = { id: number; slot: string; name: string; meta: string; href: string | null; art: React.ReactNode };
export type StripDay = { day: string; label: string; meals: StripMeal[] };

const PAGES = ["Today", "Tomorrow", "This week"];
const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

/** Today, tomorrow and the week ahead as cards. One swipe moves one card; the dark tab highlight slides along. */
export function PlanStrip({ today, tomorrow, week }: { today: StripDay; tomorrow: StripDay; week: { day: string; short: string; text: string; isToday: boolean }[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pages = useRef<(HTMLDivElement | null)[]>([]);
  const [x, setX] = useState(0);
  const [boxes, setBoxes] = useState<{ left: number; width: number }[]>([]);
  const [height, setHeight] = useState<number | null>(null);
  const page = Math.round(x);

  useEffect(() => {
    const measure = () => setBoxes(tabs.current.map((t) => ({ left: t?.offsetLeft ?? 0, width: t?.offsetWidth ?? 0 })));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // The strip is as tall as the card you're on, so a short day leaves no gap.
  useEffect(() => {
    const el = pages.current[page];
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [page]);

  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    const step = (el.scrollWidth - el.clientWidth) / (PAGES.length - 1) || 1;
    setX(Math.max(0, Math.min(PAGES.length - 1, el.scrollLeft / step)));
  };
  const go = (i: number) => {
    const el = strip.current;
    if (!el) return;
    el.scrollTo({ left: (i * (el.scrollWidth - el.clientWidth)) / (PAGES.length - 1), behavior: "smooth" });
  };
  const i0 = Math.min(Math.floor(x), PAGES.length - 2);
  const f = x - i0;
  const hl = boxes.length === PAGES.length ? { left: boxes[i0].left + (boxes[i0 + 1].left - boxes[i0].left) * f, width: boxes[i0].width + (boxes[i0 + 1].width - boxes[i0].width) * f } : null;

  return (
    <section className="space-y-3" aria-label="Your plan">
      <div className="flex items-center gap-1.5">
        <div role="tablist" className="relative flex gap-1.5">
          {hl && <span aria-hidden className="absolute top-0 h-[34px] rounded-full bg-ink" style={{ left: hl.left, width: hl.width }} />}
          {PAGES.map((p, i) => (
            <button
              key={p}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              aria-selected={page === i}
              onClick={() => go(i)}
              className={`relative h-[34px] rounded-full px-3.5 text-sm font-bold transition-colors ${page === i ? "text-white" : "text-muted"} ${!hl && page === i ? "bg-ink" : ""}`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <Link href="/plan" className="text-sm font-bold text-coral-ink hover:underline">
          Plan
        </Link>
      </div>
      <div
        ref={strip}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto overflow-y-hidden px-4 transition-[height] duration-300 md:mx-0 md:scroll-px-0 md:px-0"
        style={height ? { height } : undefined}
      >
        {[today, tomorrow].map((d, i) => (
          <div
            key={d.day}
            ref={(el) => {
              pages.current[i] = el;
            }}
            className="card w-[calc(100%-8px)] shrink-0 snap-start snap-always space-y-2.5 p-3 md:w-[calc(50%-6px)]"
          >
            <p className="text-[13px] font-semibold text-muted">{d.label}</p>
            {d.meals.length ? (
              d.meals.map((m) => <DayMeal key={m.id} m={m} />)
            ) : (
              <EmptyDay day={d.day} />
            )}
          </div>
        ))}
        <div
          ref={(el) => {
            pages.current[2] = el;
          }}
          className="card w-[calc(100%-8px)] shrink-0 snap-start snap-always px-3.5 py-1 md:w-[calc(50%-6px)]"
        >
          {week.map((w, i) => (
            <Link key={w.day} href="/plan" className={`flex items-center gap-3 py-2.5 text-sm ${i ? "border-t border-line" : ""}`}>
              <span className={`w-16 shrink-0 font-bold ${w.isToday ? "text-coral-ink" : "text-ink"}`}>{w.short}</span>
              <span className={`min-w-0 flex-1 truncate ${w.text ? "font-semibold text-ink" : "text-off"}`}>{w.text || "Nothing yet"}</span>
            </Link>
          ))}
        </div>
        <span aria-hidden className="w-1 shrink-0" />
      </div>
    </section>
  );
}

function DayMeal({ m }: { m: StripMeal }) {
  const body = (
    <>
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px]">{m.art}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold tracking-[0.06em] text-muted uppercase">{SLOT_LABEL[m.slot] ?? m.slot}</span>
        <span className="block truncate text-base font-bold">{m.name}</span>
        {m.meta && <span className="block truncate text-[13px] text-muted">{m.meta}</span>}
      </span>
    </>
  );
  return m.href ? (
    <Link href={m.href} className="flex items-center gap-3 rounded-[14px] hover:bg-sand/60">
      {body}
    </Link>
  ) : (
    <div className="flex items-center gap-3">{body}</div>
  );
}

function EmptyDay({ day }: { day: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">Nothing planned yet</span>
        <span className="block text-[13px] text-muted">Otao can pick something you’ll like.</span>
      </span>
      <button onClick={() => start(() => fillDay(day))} disabled={pending} className="btn-primary h-9 min-h-9 shrink-0 px-3.5 text-[13px]">
        <Icon.sparkle className="h-3.5 w-3.5" /> {pending ? "Picking…" : "Fill for me"}
      </button>
    </div>
  );
}
