/** Shown at once while a page loads, so taps feel instant. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-stone-200" />
      <div className="h-10 rounded-lg bg-stone-200" />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] bg-stone-200" />
            <div className="space-y-2 p-3 sm:p-4">
              <div className="h-4 w-3/4 rounded bg-stone-200" />
              <div className="h-3 w-1/2 rounded bg-stone-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
