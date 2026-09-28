import Image from "next/image";

export function MealImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
          // Photos from private stores are served by this app and may sit behind the site password.
          unoptimized={src.startsWith("/")}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-5xl opacity-60">🍲</div>
      )}
    </div>
  );
}
