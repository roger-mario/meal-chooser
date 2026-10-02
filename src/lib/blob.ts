import "server-only";
import { del, get, put } from "@vercel/blob";

// Storage integrations may prefix variables (e.g. MEAL_BLOB_READ_WRITE_TOKEN).
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env)
    .sort()
    .find((k) => k.toUpperCase().endsWith("READ_WRITE_TOKEN") && process.env[k]);
  return key ? process.env[key] : undefined;
}

function auth() {
  const token = blobToken();
  return token ? { token } : {};
}

/** Images in private stores are served through this app at /api/images/<pathname>. */
const PRIVATE_PREFIX = "/api/images/";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Checks the file's first bytes so renamed files of other types are rejected. */
async function sniffImageType(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = String.fromCharCode(...b);
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

export class ImageUploadError extends Error {}

export async function uploadMealImage(file: File): Promise<string> {
  const type = await sniffImageType(file);
  if (!type) throw new ImageUploadError("Please use a JPEG, PNG or WebP photo.");
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError("The photo is too large (max 3 MB).");

  const ext = type.split("/")[1].replace("jpeg", "jpg");
  const pathname = `meals/photo.${ext}`;
  const options = { addRandomSuffix: true, contentType: type, ...auth() };
  try {
    const blob = await put(pathname, file, { ...options, access: "public" });
    return blob.url;
  } catch (publicError) {
    // Stores created as "private" reject public uploads; fall back to a private blob.
    try {
      const blob = await put(pathname, file, { ...options, access: "private" });
      return PRIVATE_PREFIX + blob.pathname;
    } catch (privateError) {
      console.error("Image upload failed", publicError, privateError);
      throw new ImageUploadError(
        "The photo could not be saved. Check that the Blob store is connected to this project in Vercel.",
      );
    }
  }
}

/** Downloads a photo from an https link and stores it like an uploaded one. */
export async function importMealImage(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ImageUploadError("The photo could not be downloaded.");
  }
  if (!res.ok) throw new ImageUploadError(`The photo could not be downloaded (HTTP ${res.status}).`);
  if (Number(res.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("The photo is too large (max 3 MB).");
  }
  const bytes = await res.arrayBuffer();
  return uploadMealImage(new File([bytes], "photo"));
}

export async function deleteMealImage(url: string | null | undefined) {
  if (!url) return;
  const target = url.startsWith(PRIVATE_PREFIX) ? url.slice(PRIVATE_PREFIX.length) : url;
  await del(target, auth()).catch((e) => console.error("Image delete failed", e));
}

export async function readPrivateImage(pathname: string) {
  return get(pathname, { access: "private", ...auth() });
}
