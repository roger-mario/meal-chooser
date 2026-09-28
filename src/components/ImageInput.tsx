"use client";

import { useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const WIDTH = 1200;
const HEIGHT = 900; // every meal photo is stored as 4:3

// Center-crops to 4:3 and scales to 1200×900 so all photos look the same.
async function cropTo43(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const target = WIDTH / HEIGHT;
  let sw = bitmap.width;
  let sh = bitmap.height;
  if (sw / sh > target) sw = sh * target;
  else sh = sw / target;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not process image"))), "image/jpeg", 0.85),
  );
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

export function ImageInput({ currentUrl }: { currentUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      input.value = "";
      setError("Please choose a JPEG, PNG or WebP photo.");
      return;
    }
    setBusy(true);
    try {
      const cropped = await cropTo43(file);
      const dt = new DataTransfer();
      dt.items.add(cropped);
      input.files = dt.files;
      setPreview(URL.createObjectURL(cropped));
    } catch {
      input.value = "";
      setError("This photo could not be read. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition hover:border-emerald-500 hover:bg-emerald-50/50"
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 shadow">
              Change photo
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm">
            <span className="text-3xl">📷</span>
            {busy ? "Preparing…" : "Add a photo"}
            <span className="text-xs text-stone-400">JPEG, PNG or WebP · cropped to 4:3</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept={ACCEPTED.join(",")}
        onChange={onChange}
        className="hidden"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
