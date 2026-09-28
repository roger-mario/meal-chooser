"use client";

import { useState, useTransition } from "react";
import { startSharing, stopSharing } from "@/app/actions/meals";

export function ShareButton({ mealId, token }: { mealId: number; token: string | null }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  if (!token) {
    return (
      <button
        type="button"
        className="btn"
        disabled={pending}
        onClick={() => startTransition(() => startSharing(mealId))}
        title="Create a link anyone can open to view (not edit) this meal"
      >
        {pending ? "Creating link…" : "🔗 Share"}
      </button>
    );
  }

  const url = typeof window === "undefined" ? `/s/${token}` : `${window.location.origin}/s/${token}`;
  async function copy() {
    try {
      if (navigator.share && /Mobi/i.test(navigator.userAgent)) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <span className="inline-flex overflow-hidden rounded-lg border border-emerald-300">
      <button type="button" onClick={copy} className="bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
        {copied ? "✓ Link copied" : "🔗 Copy share link"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Stop sharing? The current link will stop working.")) startTransition(() => stopSharing(mealId));
        }}
        className="border-l border-emerald-300 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
        title="Stop sharing"
      >
        {pending ? "…" : "Stop"}
      </button>
    </span>
  );
}
