import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const hash = (s: string) => createHash("sha256").update(s).digest();

/** Returns an error response unless the request carries `Authorization: Bearer <API_KEY>`. */
export function checkApiKey(request: Request): Response | null {
  const key = process.env.API_KEY;
  if (!key) return Response.json({ error: "The API is disabled. Set API_KEY in Vercel to enable it." }, { status: 503 });
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!timingSafeEqual(hash(given), hash(key))) {
    return Response.json({ error: "Missing or wrong API key." }, { status: 401 });
  }
  return null;
}
