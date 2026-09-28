"use client";

import { useState } from "react";
import { CATEGORY_COLORS, FOOD_EMOJIS } from "@/lib/emoji";

export function CategoryFields({
  initial,
}: {
  initial?: { name: string; emoji: string; color: string };
}) {
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🍲");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="w-24">
          <label className="label">Icon</label>
          <input
            name="emoji"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={24}
            className="input text-center text-xl"
            aria-label="Emoji (1 to 3)"
          />
        </div>
        <div className="flex-1">
          <label className="label">Name</label>
          <input name="name" required defaultValue={initial?.name} placeholder="Baby dinner" className="input" />
        </div>
      </div>
      <div>
        <span className="label">Pick an icon, or type up to 3 emoji above</span>
        <div className="grid grid-cols-10 gap-1">
          {FOOD_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`rounded-lg p-1 text-xl transition hover:bg-stone-100 ${emoji === e ? "bg-emerald-100" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Colour</span>
        <input type="hidden" name="color" value={color} />
        <div className="flex gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              className={`h-7 w-7 rounded-full ring-offset-2 transition ${color === c ? "ring-2 ring-stone-800" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
