import { createHash, timingSafeEqual } from "node:crypto";
import { backupToGitHub, GitHubBackupError, githubBackupConfig } from "@/lib/github-backup";

export const maxDuration = 300;

const hash = (s: string) => createHash("sha256").update(s).digest();

/** Daily GitHub backup (vercel.json). Vercel sends CRON_SECRET; without it the route stays off. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Set CRON_SECRET to turn on daily backups." }, { status: 503 });
  const given = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(hash(given), hash(`Bearer ${secret}`))) return new Response("Unauthorized", { status: 401 });
  if (!githubBackupConfig()) return Response.json({ skipped: "GitHub backup isn't set up." });
  try {
    return Response.json(await backupToGitHub());
  } catch (e) {
    console.error("Daily GitHub backup failed", e);
    return Response.json({ error: e instanceof GitHubBackupError ? e.message : "Backup failed." }, { status: 500 });
  }
}
