import Link from "next/link";

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
        <SuggestBowl />
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

/** The bowl of vegetables with a leaf and a little sun that sits on the wave. */
function SuggestBowl() {
  return (
    <svg width={170} height={104} viewBox="0 0 170 104" aria-hidden>
      <path d="M8 40 C 22 18, 48 16, 58 28 C 46 44, 24 50, 8 40 Z" fill="#57B884" />
      <path d="M10 40 C 26 34, 40 30, 56 28" stroke="#3E8F63" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="92" cy="58" rx="48" ry="12" fill="#FFFDF5" />
      <circle cx="74" cy="54" r="9" fill="#F28C3B" />
      <circle cx="92" cy="50" r="10" fill="#4E9A50" />
      <circle cx="110" cy="55" r="8" fill="#E8473B" />
      <circle cx="100" cy="60" r="6" fill="#F7DC5B" />
      <circle cx="82" cy="61" r="5" fill="#A8CC6E" />
      <path d="M44 58 C 46 86, 66 100, 92 100 C 118 100, 138 86, 140 58 Z" fill="#FF7F5C" />
      <path d="M52 70 C 60 72, 124 72, 132 70" stroke="#FFB59E" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="150" cy="26" r="17" fill="#F5D34A" />
      <circle cx="150" cy="26" r="13" fill="#FFF2A8" />
      <path d="M150 14 V38 M138 26 H162 M141.5 17.5 L158.5 34.5 M158.5 17.5 L141.5 34.5" stroke="#F5D34A" strokeWidth="1.6" />
    </svg>
  );
}
