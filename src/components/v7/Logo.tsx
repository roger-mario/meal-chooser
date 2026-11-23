import { useId } from "react";

// The Otao icon: a white bowl of orange food with a leaf and three lines of steam on a green tile,
// drawn on a 512 x 512 grid. Keep it in step with public/icon.svg and mobile/src/components/Logo.tsx.
const STEAM = ["M200 150c-14-18 14-32 0-54", "M256 136c-14-20 14-36 0-60", "M312 150c-14-18 14-32 0-54"];

/**
 * The Otao icon. `animated` plays the intro once (the food drops into the bowl and the bowl wobbles)
 * and then keeps the steam rising, for the login page and loaders.
 */
export function Mark({ width = 120, animated = false, className }: { width?: number; animated?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const a = (name: string) => (animated ? name : undefined);
  return (
    <svg width={width} height={width} viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#059669" />
          <stop offset="1" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id={`${id}food`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff5e3a" />
          <stop offset="1" stopColor="#ffc14d" />
        </linearGradient>
        <linearGradient id={`${id}bowl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#fde7c2" />
        </linearGradient>
        <clipPath id={`${id}tile`}>
          <rect width="512" height="512" rx="112" />
        </clipPath>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${id}bg)`} />
      <g clipPath={`url(#${id}tile)`}>
        <g fill="none" stroke="#fef3c7" strokeWidth="16" strokeLinecap="round" opacity=".85">
          {STEAM.map((d, i) => (
            <path key={d} d={d} className={a("ot-steam")} style={animated ? { animationDelay: `${1.05 + [0.35, 0, 0.7][i]}s` } : undefined} />
          ))}
        </g>
        <g className={a("ot-bowl")}>
          <g className={a("ot-food")}>
            <path fill={`url(#${id}food)`} d="M118 266c14-46 70-74 138-74s124 28 138 74z" />
            <circle cx="190" cy="232" r="15" fill="#fde68a" opacity=".9" />
            <circle cx="318" cy="236" r="13" fill="#fde68a" opacity=".9" />
            <circle cx="246" cy="220" r="10" fill="#c2410c" opacity=".55" />
          </g>
          <g className={a("ot-leaf")}>
            <path fill="#34d399" d="M256 204c-6-30 10-52 40-60 6 30-10 52-40 60z" />
            <path fill="#10b981" d="M252 206c-22-20-46-20-64-6 20 18 44 20 64 6z" />
          </g>
          <path fill={`url(#${id}bowl)`} d="M96 262h320c0 92-70 160-160 160S96 354 96 262z" />
          <rect x="84" y="250" width="344" height="28" rx="14" fill="#fffaf0" />
        </g>
      </g>
    </svg>
  );
}

/** Icon plus "otao", for the header and shared pages. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark width={Math.round(size * 1.4)} />
      <span className="font-extrabold tracking-tight text-ink" style={{ fontSize: size, lineHeight: 1 }}>
        otao
      </span>
    </span>
  );
}

/** Full-area loader with the animated icon. */
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex min-h-[50vh] flex-1 items-center justify-center">
      <Mark width={104} animated />
    </div>
  );
}
