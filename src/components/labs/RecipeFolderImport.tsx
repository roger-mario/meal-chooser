"use client";

import { unzipSync } from "fflate";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { importFolderCategories, importFolderMeal } from "@/app/actions/recipe-folder";
import { FOLDER_INDEX, parseBackupFile, parseFolder, type ParsedFolder } from "@/lib/recipe-folder";

const PHOTO_TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

async function readFile(file: File): Promise<ParsedFolder> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x7b /* { */) return parseBackupFile(bytes);
  let files;
  try {
    // Only what import needs, so a big repository zip stays light.
    files = unzipSync(bytes, {
      filter: (f) => f.name.endsWith(FOLDER_INDEX) || f.name.endsWith("/recipe.json") || /\/photo\.(jpe?g|png|webp)$/i.test(f.name),
    });
  } catch {
    throw new Error("This file is neither a zip nor an Otao backup.");
  }
  return parseFolder(new Map(Object.entries(files)));
}

type Progress = { done: number; total: number; added: number; skipped: number; failed: string[] };

/** Unzips in the browser and sends one recipe at a time, so photos never hit the request size limit. */
export function RecipeFolderImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  async function run() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(null);
    try {
      const folder = await readFile(file);
      if (folder.recipes.length === 0) throw new Error("No recipes found in this file.");
      const cats = await importFolderCategories(JSON.stringify(folder.categories));
      if (cats.error) throw new Error(cats.error);

      const p: Progress = { done: 0, total: folder.recipes.length, added: 0, skipped: 0, failed: [] };
      setProgress({ ...p });
      for (const { meal, photo } of folder.recipes) {
        const data = new FormData();
        data.set("meal", JSON.stringify(meal));
        if (photo) {
          const ext = photo.name.split(".").pop()!.toLowerCase();
          data.set("photo", new File([photo.bytes as Uint8Array<ArrayBuffer>], photo.name, { type: PHOTO_TYPES[ext] }));
        }
        const r = await importFolderMeal(data).catch(() => ({ status: "error" as const, error: "connection lost" }));
        if (r.status === "added") p.added++;
        else if (r.status === "skipped") p.skipped++;
        else p.failed.push(`${meal.name} (${r.error})`);
        p.done++;
        setProgress({ ...p, failed: [...p.failed] });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".zip,application/zip,application/json,.json"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setProgress(null);
          setError(null);
        }}
        className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-2"
      />
      <button type="button" className="btn-primary" disabled={!file || busy} onClick={run}>
        {busy ? (progress ? `Importing ${progress.done + 1} of ${progress.total}…` : "Reading…") : "Import recipes"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {progress && !busy && (
        <div className="space-y-1 text-sm">
          <p className="text-emerald-700">
            ✓ Added {progress.added} recipe{progress.added === 1 ? "" : "s"}.
            {progress.skipped > 0 && ` Skipped ${progress.skipped} you already have (same name).`}
          </p>
          {progress.failed.length > 0 && <p className="text-red-600">Not imported: {progress.failed.join(", ")}</p>}
        </div>
      )}
    </div>
  );
}
