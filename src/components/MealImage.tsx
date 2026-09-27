import Image from "next/image";

export function MealImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-4xl text-stone-300">🍽</div>
      )}
    </div>
  );
}
