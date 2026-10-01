/** Same shape as the meal page, shown while it loads. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading">
      <div className="card -mx-4 -mt-5 overflow-hidden rounded-none border-x-0 border-t-0 sm:mx-0 sm:mt-0 sm:rounded-xl sm:border md:grid md:grid-cols-2">
        <div className="aspect-[4/3] bg-stone-200" />
        <div className="space-y-3 p-4 sm:p-6">
          <div className="h-6 w-24 rounded-full bg-stone-200" />
          <div className="h-8 w-3/4 rounded-lg bg-stone-200" />
          <div className="h-4 w-full rounded bg-stone-100" />
          <div className="h-4 w-2/3 rounded bg-stone-100" />
        </div>
      </div>
      <div className="card h-48" />
      <div className="card h-48" />
    </div>
  );
}
