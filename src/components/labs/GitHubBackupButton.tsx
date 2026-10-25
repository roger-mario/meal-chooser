"use client";

import { useActionState } from "react";
import { backupToGitHubNow } from "@/app/actions/recipe-folder";
import { SubmitButton } from "../SubmitButton";

export function GitHubBackupButton() {
  const [state, action] = useActionState(backupToGitHubNow, null);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pendingText="Backing up…">⬆️ Back up now</SubmitButton>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-emerald-700">
          ✓ {state.message}{" "}
          {state.url && (
            <a href={state.url} target="_blank" rel="noreferrer" className="underline">
              See the change on GitHub
            </a>
          )}
        </p>
      )}
    </form>
  );
}
