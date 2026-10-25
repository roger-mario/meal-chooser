import { GitHubBackupButton } from "@/components/labs/GitHubBackupButton";
import { RecipeFolderImport } from "@/components/labs/RecipeFolderImport";
import { githubBackupConfig, lastBackup } from "@/lib/github-backup";

export const dynamic = "force-dynamic";
// "Back up now" downloads every photo and may write many files to GitHub.
export const maxDuration = 300;

export default async function BackupPage() {
  const config = githubBackupConfig();
  const last = config ? await lastBackup() : null;
  const daily = !!process.env.CRON_SECRET;

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-sm text-stone-600 sm:text-base">
        Your recipes as a folder of files: one folder per recipe with the data, a readable page and the photo. Keep it
        anywhere, or let Otao keep it in your own GitHub repository, where every change is saved as a new version.
      </p>

      <section className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">⬇️ Download</h2>
        <p className="text-sm text-stone-600">
          A zip with all meals, categories, nutrition, prices and photos. Chat messages and the Labs day log aren&apos;t
          included.
        </p>
        <a href="/api/backup/folder" className="btn-primary">
          Download recipe folder (.zip)
        </a>
      </section>

      <section className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">🐙 GitHub backup</h2>
        {config ? (
          <>
            <p className="text-sm text-stone-600">
              Backing up to{" "}
              <a href={`https://github.com/${config.repo}`} target="_blank" rel="noreferrer" className="font-medium underline">
                {config.repo}
              </a>
              {daily ? " every night, and whenever you tap the button." : " whenever you tap the button."} Only changes
              are saved, so the{" "}
              <a href={`https://github.com/${config.repo}/commits`} target="_blank" rel="noreferrer" className="underline">
                history
              </a>{" "}
              shows what changed when.
            </p>
            {last && (
              <p className="text-sm text-stone-500">
                Last change in the repository:{" "}
                <a href={last.url} target="_blank" rel="noreferrer" className="underline">
                  {new Date(last.date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: process.env.APP_TIMEZONE || undefined })}
                </a>
              </p>
            )}
            <GitHubBackupButton />
            {!daily && (
              <p className="text-sm text-stone-500">
                For a nightly backup, add <code>CRON_SECRET</code> (any long random text) in Vercel → Settings →
                Environment Variables and redeploy.
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2 text-sm text-stone-600">
            <p>Not set up yet. It takes a few minutes and no extra login in Otao:</p>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                On GitHub, create a <b>private</b> repository, e.g. <code>otao-recipes</code>.
              </li>
              <li>
                Create a{" "}
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="underline">
                  fine-grained token
                </a>
                : <i>Only select repositories</i> → that repository, and under <i>Repository permissions</i> set{" "}
                <b>Contents</b> to <b>Read and write</b>. Pick a long expiry and note the date.
              </li>
              <li>
                In Vercel → Settings → Environment Variables add <code>GITHUB_BACKUP_REPO</code> (e.g.{" "}
                <code>your-name/otao-recipes</code>), <code>GITHUB_BACKUP_TOKEN</code> (the token) and, for a nightly
                backup, <code>CRON_SECRET</code> (any long random text). Then redeploy.
              </li>
            </ol>
          </div>
        )}
      </section>

      <section className="card space-y-3 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">⬆️ Import</h2>
        <p className="text-sm text-stone-600">
          Bring recipes in from a downloaded recipe folder, or from a GitHub backup: on the repository page tap{" "}
          <i>Code → Download ZIP</i> and pick that file here. Older backup files (.json from the Help page) work too.
          Recipes with a name you already have are skipped; nothing is deleted.
        </p>
        <RecipeFolderImport />
      </section>
    </div>
  );
}
