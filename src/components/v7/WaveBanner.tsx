import Link from "next/link";
import { Mark } from "./Logo";

/** The sky-blue "Otao suggests" wave that flows into its cards and then into a raised panel below. */
export function WaveBanner({ title, text, href, children, panel }: { title: string; text: string; href: string; children: React.ReactNode; panel?: React.ReactNode }) {
  return (
    <section className="relative -mx-4 md:mx-0">
      <svg viewBox="0 0 390 64" preserveAspectRatio="none" aria-hidden className="absolute top-[46px] left-0 h-16 w-full md:rounded-t-[32px]">
        <path d="M0 34 C 70 4, 120 4, 190 24 S 320 52, 390 18 L 390 64 L 0 64 Z" fill="#E4F0FB" />
      </svg>
      <div aria-hidden className="absolute inset-x-0 top-[109px] bottom-0 bg-sky md:rounded-b-[32px]">
        <svg width="150" height="90" viewBox="0 0 150 90" className="absolute top-1 left-0">
          <path d="M0 16 C 40 -4, 80 0, 110 18 S 150 48, 120 60 L 0 64 Z" fill="#F1F7FD" />
        </svg>
      </div>
      <div className="relative flex h-[104px] justify-end pr-6">
        <Mark width={170} />
      </div>
      <div className="relative flex flex-col gap-2 px-4 pb-5 md:px-8">
        <span className="self-start rounded-full bg-coral px-2.5 py-1 text-xs font-extrabold tracking-[0.05em] text-white">FOR YOU</span>
        <Link href={href} className="group flex items-center gap-3">
          <span className="flex-1 text-[22px] leading-tight font-extrabold tracking-tight">{title}</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition group-hover:translate-x-0.5">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
        <p className="text-[15px] leading-relaxed text-ink2">{text}</p>
      </div>
      <div className="relative md:px-8">{children}</div>
      {panel && (
        <div className="relative mt-[52px] rounded-t-[32px] bg-bg px-4 pt-3.5 pb-2 shadow-[0_-10px_28px_rgba(42,38,34,0.08)] md:rounded-[32px] md:px-8 md:pb-8">
          <span aria-hidden className="mx-auto mb-5 block h-[5px] w-10 rounded-full bg-line-strong" />
          {panel}
        </div>
      )}
    </section>
  );
}
