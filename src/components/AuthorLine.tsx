import type { MealAuthor } from "@/lib/queries";
import { Avatar } from "./Avatar";

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: process.env.APP_TIMEZONE || "UTC" });
}

/** Small "by Roger · added 28 Sep 2026 · edited 29 Sep 2026" line. */
export function AuthorLine({
  author,
  createdAt,
  updatedAt,
  compact = false,
}: {
  author: MealAuthor | null;
  createdAt: Date;
  updatedAt: Date;
  compact?: boolean;
}) {
  const edited = updatedAt.getTime() - createdAt.getTime() > 60_000;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-stone-400">
      {author && (
        <span className="inline-flex items-center gap-1 text-stone-500">
          {!compact && <Avatar id={author.id} name={author.name} size="sm" />}
          {author.name}
        </span>
      )}
      {author && <span>·</span>}
      <time dateTime={createdAt.toISOString()} title={createdAt.toLocaleString("en-GB")}>
        {compact ? fmt(createdAt) : `Added ${fmt(createdAt)}`}
      </time>
      {edited && !compact && (
        <>
          <span>·</span>
          <time dateTime={updatedAt.toISOString()} title={updatedAt.toLocaleString("en-GB")}>
            Edited {fmt(updatedAt)}
          </time>
        </>
      )}
    </p>
  );
}
