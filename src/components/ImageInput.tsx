"use client";

import { useRef, useState } from "react";

const MAX_SIDE = 1600;

// Downscale photos in the browser so phone pictures stay well under the upload limit.
async function resize(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Resize failed"))), "image/jpeg", 0.85),
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function ImageInput({ currentUrl }: { currentUrl?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const resized = await resize(file);
      const dt = new DataTransfer();
      dt.items.add(resized);
      if (inputRef.current) inputRef.current.files = dt.files;
      setPreview(URL.createObjectURL(resized));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-24 w-24 rounded-lg object-cover" />
      )}
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        onChange={onChange}
        className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-2"
      />
      {busy && <span className="text-sm text-stone-500">Preparing…</span>}
    </div>
  );
}
