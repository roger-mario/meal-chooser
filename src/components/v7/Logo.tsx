/** The Otao mark: a bowl of vegetables with a leaf and a little sun. `animated` turns it into the loader. */
export function Mark({ width = 170, animated = false, className }: { width?: number; animated?: boolean; className?: string }) {
  const veg = [
    { cx: 74, cy: 54, r: 9, fill: "#F28C3B" },
    { cx: 92, cy: 50, r: 10, fill: "#4E9A50" },
    { cx: 110, cy: 55, r: 8, fill: "#E8473B" },
    { cx: 100, cy: 60, r: 6, fill: "#F7DC5B" },
    { cx: 82, cy: 61, r: 5, fill: "#A8CC6E" },
  ];
  return (
    <svg width={width} height={Math.round((width * 104) / 170)} viewBox="0 0 170 104" className={className} aria-hidden>
      <g className={animated ? "ot-leaf" : undefined}>
        <path d="M8 40 C 22 18, 48 16, 58 28 C 46 44, 24 50, 8 40 Z" fill="#57B884" />
        <path d="M10 40 C 26 34, 40 30, 56 28" stroke="#3E8F63" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="92" cy="58" rx="48" ry="12" fill="#FFFDF5" />
      {veg.map((v, i) => (
        <circle key={v.fill} {...v} className={animated ? "ot-veg" : undefined} style={animated ? { animationDelay: `${i * 0.12}s` } : undefined} />
      ))}
      <path d="M44 58 C 46 86, 66 100, 92 100 C 118 100, 138 86, 140 58 Z" fill="#FF7F5C" />
      <path d="M52 70 C 60 72, 124 72, 132 70" stroke="#FFB59E" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g className={animated ? "ot-sun" : undefined}>
        <circle cx="150" cy="26" r="17" fill="#F5D34A" />
        <circle cx="150" cy="26" r="13" fill="#FFF2A8" />
        <path d="M150 14 V38 M138 26 H162 M141.5 17.5 L158.5 34.5 M158.5 17.5 L141.5 34.5" stroke="#F5D34A" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/** Mark plus "otao", for the header and the login page. */
export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Mark width={Math.round(size * 2)} />
      <span className="font-extrabold tracking-tight text-ink" style={{ fontSize: size, lineHeight: 1 }}>
        otao
      </span>
    </span>
  );
}

/** Full-area loader with the animated mark. */
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex min-h-[50vh] flex-1 items-center justify-center">
      <Mark width={130} animated />
    </div>
  );
}
