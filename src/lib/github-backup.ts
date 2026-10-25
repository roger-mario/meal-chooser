import "server-only";
import { createHash } from "node:crypto";
import { FOLDER_INDEX, RECIPES_DIR } from "./recipe-folder";
import { buildRecipeFolder } from "./recipe-folder-build";

/**
 * Optional backup of the recipe folder into a GitHub repository, with one commit per change.
 * Set GITHUB_BACKUP_REPO ("owner/name") and GITHUB_BACKUP_TOKEN (a fine-grained token for that
 * repository with "Contents: Read and write"). GITHUB_BACKUP_BRANCH defaults to the repo's default branch.
 */
export function githubBackupConfig() {
  const repo = process.env.GITHUB_BACKUP_REPO?.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$|\/$/g, "");
  const token = process.env.GITHUB_BACKUP_TOKEN?.trim();
  if (!repo || !token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return { repo, token, branch: process.env.GITHUB_BACKUP_BRANCH?.trim() || null };
}

export class GitHubBackupError extends Error {}
/** 404, or 409 for an empty repository. */
class HttpNotFound extends GitHubBackupError {}

type Config = NonNullable<ReturnType<typeof githubBackupConfig>>;

async function gh<T>(config: Config, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${config.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "otao-backup",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (res.ok) return (await res.json()) as T;
  const detail = await res.text().catch(() => "");
  console.error("GitHub backup", method, path, res.status, detail.slice(0, 500));
  if (res.status === 401) throw new GitHubBackupError("GitHub refused the token: it may have expired. Create a new one and update GITHUB_BACKUP_TOKEN.");
  if (res.status === 403) throw new GitHubBackupError("The token isn't allowed to write to this repository. Give it \"Contents: Read and write\" for it.");
  if (res.status === 404) throw new HttpNotFound(`GitHub can't find ${config.repo} (or the token can't see it).`);
  if (res.status === 409) throw new HttpNotFound("The repository is empty.");
  throw new GitHubBackupError(`GitHub answered with an error (HTTP ${res.status}). Please try again later.`);
}

const gitBlobSha = (bytes: Uint8Array) =>
  createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

/** Files Otao writes; anything else in the repository is left alone. */
const isManaged = (path: string) => path === FOLDER_INDEX || path === "README.md" || path.startsWith(`${RECIPES_DIR}/`);

async function branchName(config: Config) {
  if (config.branch) return config.branch;
  return (await gh<{ default_branch: string }>(config, "GET", "")).default_branch;
}

async function headCommit(config: Config, branch: string): Promise<string | null> {
  try {
    const ref = await gh<{ object: { sha: string } }>(config, "GET", `/git/ref/heads/${encodeURIComponent(branch)}`);
    return ref.object.sha;
  } catch (e) {
    // An empty repository has no branch yet.
    if (e instanceof HttpNotFound) return null;
    throw e;
  }
}

export type BackupResult = { changed: number; added: number; removed: number; commitUrl?: string };

/** Commits the current recipes to the repository. Makes no commit when nothing changed. */
export async function backupToGitHub(): Promise<BackupResult> {
  const config = githubBackupConfig();
  if (!config) throw new GitHubBackupError("GitHub backup isn't set up yet.");
  const [files, branch] = await Promise.all([buildRecipeFolder(), branchName(config)]);

  let head = await headCommit(config, branch);
  if (!head) {
    // The Git database API doesn't work on an empty repository; the contents API can make the first commit.
    const first = await gh<{ commit: { sha: string } }>(config, "PUT", `/contents/${FOLDER_INDEX}`, {
      message: "Start Otao recipe backup",
      content: base64(files.get(FOLDER_INDEX)!),
      branch,
    });
    head = first.commit.sha;
  }

  const commit = await gh<{ tree: { sha: string } }>(config, "GET", `/git/commits/${head}`);
  const tree = await gh<{ tree: { path: string; type: string; sha: string }[]; truncated: boolean }>(
    config,
    "GET",
    `/git/trees/${commit.tree.sha}?recursive=1`,
  );
  const existing = new Map(tree.tree.filter((t) => t.type === "blob").map((t) => [t.path, t.sha]));

  const changedPaths = [...files].filter(([path, bytes]) => existing.get(path) !== gitBlobSha(bytes));
  // A truncated listing (huge repository) can't tell what's gone, so nothing is deleted then.
  const removedPaths = tree.truncated ? [] : [...existing.keys()].filter((p) => isManaged(p) && !files.has(p));
  if (changedPaths.length === 0 && removedPaths.length === 0) return { changed: 0, added: 0, removed: 0 };

  const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  for (const [path, bytes] of changedPaths) {
    const blob = await gh<{ sha: string }>(config, "POST", "/git/blobs", { content: base64(bytes), encoding: "base64" });
    entries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  for (const path of removedPaths) entries.push({ path, mode: "100644", type: "blob", sha: null });

  const recipeOf = (path: string) => path.match(new RegExp(`^${RECIPES_DIR}/([^/]+)/recipe\\.json$`))?.[1];
  const added = changedPaths.filter(([p]) => recipeOf(p) && !existing.has(p)).map(([p]) => recipeOf(p)!);
  const edited = changedPaths.filter(([p]) => recipeOf(p) && existing.has(p)).map(([p]) => recipeOf(p)!);
  const removed = removedPaths.map(recipeOf).filter((s): s is string => !!s);
  const summary = [
    added.length && `${added.length} added`,
    edited.length && `${edited.length} changed`,
    removed.length && `${removed.length} removed`,
  ].filter(Boolean);
  const message = [
    `Otao backup: ${summary.length ? summary.join(", ") : "photos and categories"}`,
    "",
    ...added.map((s) => `+ ${s}`),
    ...edited.map((s) => `~ ${s}`),
    ...removed.map((s) => `- ${s}`),
  ]
    .join("\n")
    .trim();

  const newTree = await gh<{ sha: string }>(config, "POST", "/git/trees", { base_tree: commit.tree.sha, tree: entries });
  const newCommit = await gh<{ sha: string; html_url: string }>(config, "POST", "/git/commits", {
    message,
    tree: newTree.sha,
    parents: [head],
  });
  await gh(config, "PATCH", `/git/refs/heads/${encodeURIComponent(branch)}`, { sha: newCommit.sha });
  return { changed: edited.length, added: added.length, removed: removed.length, commitUrl: newCommit.html_url };
}

/** When the backup branch last changed, for the Labs page. Null when unknown. */
export async function lastBackup(): Promise<{ date: string; url: string } | null> {
  const config = githubBackupConfig();
  if (!config) return null;
  try {
    const branch = await branchName(config);
    const commits = await gh<{ html_url: string; commit: { committer: { date: string } } }[]>(
      config,
      "GET",
      `/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
    );
    return commits[0] ? { date: commits[0].commit.committer.date, url: commits[0].html_url } : null;
  } catch {
    return null;
  }
}
