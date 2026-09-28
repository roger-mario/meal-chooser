"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/actions/meals";

export type JobStatus = { running: boolean; startedAt: string | null; error: string | null };

/**
 * Starts an AI estimate that runs in the background on the server, then shows a
 * "working on it" status and refreshes the page until the result is saved.
 */
export function EstimateButton({
  action,
  hasEstimate,
  label,
  job,
  workingText,
}: {
  action: (state: FormState) => Promise<FormState>;
  hasEstimate: boolean;
  label: string;
  job: JobStatus;
  workingText: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const running = pending || job.running;
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const started = job.startedAt ? new Date(job.startedAt).getTime() : Date.now();
    const tick = () => setSeconds(Math.max(0, Math.round((Date.now() - started) / 1000)));
    tick();
    const clock = setInterval(tick, 1000);
    // Look for the result every few seconds.
    const poll = job.running ? setInterval(() => router.refresh(), 2500) : undefined;
    return () => {
      clearInterval(clock);
      if (poll) clearInterval(poll);
    };
  }, [running, job.running, job.startedAt, router]);

  const error = state?.error ?? (running ? null : job.error);
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      {!running && (
        <form action={formAction}>
          <button type="submit" className={hasEstimate ? "btn" : "btn-primary"}>
            ✨ {hasEstimate ? "Re-estimate" : label}
          </button>
        </form>
      )}
      {running && (
        <div role="status" className="w-full overflow-hidden rounded-xl border border-violet-200 bg-violet-50 sm:w-80">
          <div className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-300 border-t-violet-700" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-violet-900">{workingText}</p>
              <p className="text-xs text-violet-700/80">
                {seconds > 0 ? `${seconds}s` : "Starting"} · usually 10 to 40 seconds. You can leave this page.
              </p>
            </div>
          </div>
          <div className="h-1 bg-violet-100">
            <div className="h-full w-1/3 animate-[ai-progress_1.4s_ease-in-out_infinite] rounded-full bg-violet-500" />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="max-w-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
