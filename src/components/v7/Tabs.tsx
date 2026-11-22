"use client";

import { useState } from "react";

/** Simple pill tabs over panels that were rendered on the server. */
export function Tabs({ tabs, initial = 0 }: { tabs: { label: string; count?: number; panel: React.ReactNode }[]; initial?: number }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="space-y-4">
      <div role="tablist" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {tabs.map((t, i) => (
          <button key={t.label} role="tab" aria-selected={on === i} onClick={() => setOn(i)} className={on === i ? "chip-on" : "chip"}>
            {t.label}
            {t.count != null && <span className={on === i ? "text-white/70" : "text-off"}>{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">{tabs[on]?.panel}</div>
    </div>
  );
}
