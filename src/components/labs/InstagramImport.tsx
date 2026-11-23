"use client";

import Link from "next/link";
import { useState } from "react";
import { creatorReelLinks, importInstagramLink, type LinkImport } from "@/app/actions/import";

type Row = { link: string; result?: LinkImport; running?: boolean };

export function InstagramImport({ canList }: { canList: boolean }) {
  const [text, setText] = useState("");
  const [creator, setCreator] = useState("");
  const [photo, setPhoto] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const links = [...new Set(text.split(/[\s,]+/).filter((l) => /instagram\.com\//i.test(l)))];
  const handle = creator.trim().replace(/^@/, "").replace(/.*instagram\.com\//i, "").replace(/\/.*$/, "");

  async function findReels() {
    setNote(null);
    setBusy(true);
    const r = await creatorReelLinks(creator);
    setBusy(false);
    if (r.error === "not-configured") {
      setNote("Listing reels automatically isn't set up yet. Open the creator's reels, copy the links of the recipes you like and paste them below.");
    } else if (r.error) setNote(r.error);
    else if (r.links?.length) {
      setText((t) => [...new Set([...t.split(/\s+/).filter(Boolean), ...r.links!])].join("\n"));
      setNote(`Added ${r.links.length} new reel link${r.links.length === 1 ? "" : "s"}.`);
    } else setNote("No new reels: everything recent is already in Otao.");
  }

  async function run() {
    setBusy(true);
    const next: Row[] = links.map((link) => ({ link }));
    setRows(next);
    // One at a time: kinder to Instagram and to the AI rate limit.
    for (let i = 0; i < next.length; i++) {
      setRows((r) => r.map((x, j) => (j === i ? { ...x, running: true } : x)));
      const result = await importInstagramLink(next[i].link, photo).catch(() => ({ status: "failed" as const, error: "Network error" }));
      setRows((r) => r.map((x, j) => (j === i ? { link: x.link, result } : x)));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <section className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">1. Pick a creator</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            placeholder="@adamwolfefitness"
            className="input min-w-0 flex-1"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {canList ? (
            <button type="button" className="btn" disabled={busy || !handle} onClick={findReels}>
              Find new reels
            </button>
          ) : (
            handle && (
              <a className="btn" href={`https://www.instagram.com/${encodeURIComponent(handle)}/reels/`} target="_blank" rel="noreferrer">
                Open their reels ↗
              </a>
            )
          )}
        </div>
        {note && <p className="text-sm text-stone-600">{note}</p>}
      </section>

      <section className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">2. Paste reel or post links</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={"https://www.instagram.com/reel/…\nhttps://www.instagram.com/p/…"}
          className="input w-full font-mono text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} />
          Use the reel&apos;s cover picture as the photo (often shows the creator, not the food; without it the recipe gets an illustration)
        </label>
        <button type="button" className="btn-primary" disabled={busy || !links.length} onClick={run}>
          {busy ? "Importing…" : `Import ${links.length || ""} recipe${links.length === 1 ? "" : "s"}`}
        </button>
        <p className="text-xs text-stone-500">
          Otao reads the caption, writes it up as a recipe, and saves it as a private meal with a link back to the creator.
          Posts without a real recipe are skipped. Already imported links are not added twice.
        </p>
      </section>

      {rows.length > 0 && (
        <ul className="card divide-y divide-stone-100 p-0">
          {rows.map((r) => (
            <li key={r.link} className="space-y-1 p-3 text-sm">
              <p className="truncate text-xs text-stone-500">{r.link}</p>
              <ResultLine row={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultLine({ row }: { row: Row }) {
  const r = row.result;
  if (row.running) return <p className="text-stone-600">Reading the recipe…</p>;
  if (!r) return <p className="text-stone-400">Waiting</p>;
  if (r.status === "created")
    return (
      <p>
        ✅ <Link href={`/meals/${r.id}`} className="font-semibold underline">{r.name}</Link>{" "}
        <span className="text-stone-500">· detail {r.quality}/5{r.filledIn.length ? ` · filled in: ${r.filledIn.join("; ")}` : ""}</span>
      </p>
    );
  if (r.status === "exists")
    return (
      <p>
        ↩️ Already in Otao: <Link href={`/meals/${r.id}`} className="underline">open it</Link>
      </p>
    );
  if (r.status === "skipped") return <p className="text-amber-700">⏭️ Skipped: {r.reason}</p>;
  if (r.status === "failed") return <p className="text-red-600">⚠️ {r.error}</p>;
  return null;
}
