import Image from "next/image";

export function MealImage({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 50vw",
  preload = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  /** How wide the photo is shown, so phones download a small version. The default fits the home grid. */
  sizes?: string;
  /** For photos visible right away, so they don't wait for the rest of the page. */
  preload?: boolean;
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-5xl opacity-60">🍲</div>
      )}
    </div>
  );
}
