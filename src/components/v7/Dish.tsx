import Image from "next/image";
import { dishSvg, foodFor } from "@/lib/art";
import { tileFor } from "@/lib/look";

/** A recipe's photo, or a soft food illustration on a pastel tile when there is none. */
export function Dish({
  meal,
  className = "",
  sizes = "(min-width: 1024px) 320px, 50vw",
  preload = false,
  tile,
}: {
  meal: { id: number; name: string; imageUrl: string | null };
  className?: string;
  sizes?: string;
  preload?: boolean;
  /** Overrides the pastel tile behind an illustration. */
  tile?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: tile ?? tileFor(meal.id) }}>
      {meal.imageUrl ? (
        <Image src={meal.imageUrl} alt="" fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        // The illustration is generated from fixed shapes and colours, never from user input.
        <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: dishSvg(foodFor(meal.name, meal.id), meal.name + meal.id) }} />
      )}
    </div>
  );
}

/** The green "Otao 82" chip. */
export function ScoreChip({ score, className = "" }: { score: number | null | undefined; className?: string }) {
  if (score == null) return null;
  return <span className={`inline-flex h-[26px] items-center rounded-full bg-white px-2.5 text-xs font-extrabold text-mint-ink ${className}`}>Otao {score}</span>;
}
