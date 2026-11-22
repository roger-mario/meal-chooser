/** A foldable card section, like the iPhone app's recipe page. Works without JavaScript. */
export function Fold({ title, meta, open = false, id, children }: { title: string; meta?: React.ReactNode; open?: boolean; id?: string; children: React.ReactNode }) {
  return (
    <details id={id} open={open} className="card group scroll-mt-24 overflow-hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3.5 select-none hover:bg-sand/40 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-[17px] font-extrabold">{title}</span>
        {meta && <span className="text-sm font-semibold text-muted">{meta}</span>}
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-off transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="space-y-4 px-4 pb-5 sm:px-5">{children}</div>
    </details>
  );
}
