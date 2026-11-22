import Image from "next/image";

/** A recipe photo, or a soft sand tile when there is none. */
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
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-sand ${className}`}>
      {src && <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />}
    </div>
  );
}
