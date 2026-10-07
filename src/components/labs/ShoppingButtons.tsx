"use client";

import { useState } from "react";

/** Sends the merged list to Bring!, which reads it from our signed public page and asks which list to add it to. */
export function BringListButton({ token }: { token: string }) {
  function open() {
    const params = new URLSearchParams({
      url: `${window.location.origin}/api/bring/list/${token}`,
      source: "web",
      baseQuantity: "1",
      requestedQuantity: "1",
    });
    window.location.href = `https://api.getbring.com/rest/bringrecipes/deeplink?${params}`;
  }
  return (
    <button type="button" className="btn-primary" onClick={open}>
      🛒 Add all to Bring!
    </button>
  );
}

export function CopyListButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "✓ Copied" : "📋 Copy list"}
    </button>
  );
}
