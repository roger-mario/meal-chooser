"use client";

import { useActionState, useState } from "react";
import { importBackup } from "@/app/actions/backup";
import { SubmitButton } from "./SubmitButton";

export function ImportBackupForm() {
  const [state, action] = useActionState(importBackup, null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (mode === "replace" && !confirm("Delete ALL current meals and categories and replace them with the backup?")) {
          e.preventDefault();
        }
      }}
      className="space-y-3"
    >
      <input
        type="file"
        name="file"
        accept="application/json,.json"
        required
        className="block w-full max-w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-2"
      />
      <div className="space-y-1.5 text-sm">
        <label className="flex items-start gap-2">
          <input type="radio" name="mode" value="merge" checked={mode === "merge"} onChange={() => setMode("merge")} className="mt-1" />
          <span>
            <b>Add to what I have</b> <span className="text-stone-500">(meals with the same name are skipped)</span>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input type="radio" name="mode" value="replace" checked={mode === "replace"} onChange={() => setMode("replace")} className="mt-1" />
          <span>
            <b>Start fresh</b> <span className="text-stone-500">(deletes all current meals, categories and photos first)</span>
          </span>
        </label>
      </div>
      <SubmitButton className={mode === "replace" ? "btn-danger" : "btn-primary"} pendingText="Importing…">
        Import backup
      </SubmitButton>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.message && <p className="text-sm text-emerald-700">✓ {state.message}</p>}
    </form>
  );
}
