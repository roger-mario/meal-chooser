/** The v7 line icons, the same shapes as in the iPhone app. */
type P = { className?: string; strokeWidth?: number };
const line = (className: string | undefined, w: number) =>
  ({ viewBox: "0 0 24 24", className: className ?? "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }) as const;

export const Icon = {
  home: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  feed: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <rect x="5" y="3" width="14" height="18" rx="3" />
      <path d="M10.5 9.5v5l4-2.5z" />
    </svg>
  ),
  plan: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  search: ({ className, strokeWidth = 2 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  ),
  you: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </svg>
  ),
  plus: ({ className, strokeWidth = 2.4 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  back: ({ className, strokeWidth = 2.2 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  chevron: ({ className, strokeWidth = 2 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  down: ({ className, strokeWidth = 2.2 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  sparkle: ({ className }: P) => (
    <svg viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.6L19.5 9l-5.7 1.6L12 16l-1.8-5.4L4.5 9l5.7-1.4z" />
    </svg>
  ),
  fridge: ({ className, strokeWidth = 1.8 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M5 10h14M8.5 6v1.5M8.5 13v2.5" />
    </svg>
  ),
  cart: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </svg>
  ),
  leaf: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" />
      <path d="M5 19l7-7" />
    </svg>
  ),
  stack: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <rect x="4" y="8" width="16" height="12" rx="2.5" />
      <path d="M7 5h10M9 2.5h6" />
    </svg>
  ),
  tag: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  ),
  help: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" />
    </svg>
  ),
  flask: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7.5 15h9" />
    </svg>
  ),
  shield: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </svg>
  ),
  edit: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM14 7.5l3 3" />
    </svg>
  ),
  heart: ({ className, strokeWidth = 1.9, filled = false }: P & { filled?: boolean }) => (
    <svg viewBox="0 0 24 24" className={className ?? "h-6 w-6"} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.3 4 6.4C19 15.6 12 20 12 20z" />
    </svg>
  ),
  chat: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M5 18.5 3.5 21l.8-4A8 8 0 1 1 7.5 19.6" />
    </svg>
  ),
  close: ({ className, strokeWidth = 2.4 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  logout: ({ className, strokeWidth = 1.9 }: P) => (
    <svg {...line(className, strokeWidth)}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
    </svg>
  ),
};
