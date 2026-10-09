"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteComment, sendComment, type ChatState } from "@/app/actions/comments";
import type { ChatMessage } from "@/lib/queries";
import { Avatar } from "./Avatar";

// Dates use the app's time zone on both server and browser so the page renders the same everywhere.
function dayKey(d: Date, timeZone: string) {
  return d.toLocaleDateString("en-CA", { timeZone });
}

function dayLabel(d: Date, timeZone: string) {
  const now = Date.now();
  const key = dayKey(d, timeZone);
  if (key === dayKey(new Date(now), timeZone)) return "Today";
  if (key === dayKey(new Date(now - 86_400_000), timeZone)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone });
}

function time(d: Date, timeZone: string) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
      />
    </svg>
  );
}

/** Notes-style chat on a meal, laid out like the rest of the recipe: messages grouped by person and day. */
export function MealChat({
  mealId,
  messages,
  meId,
  timeZone,
}: {
  mealId: number;
  messages: ChatMessage[];
  meId: number | null;
  timeZone: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ChatState, FormData>(sendComment.bind(null, mealId), null);
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Clear the box after a message was sent.
  useEffect(() => {
    if (state?.sent) formRef.current?.reset();
  }, [state?.sent]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  // Pick up messages from others while the page is open.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 20_000);
    return () => clearInterval(t);
  }, [router]);

  const days = messages.map((m) => dayLabel(new Date(m.createdAt), timeZone));
  const times = messages.map((m) => time(new Date(m.createdAt), timeZone));
  return (
    <div>
      {messages.length === 0 ? (
        <p className="text-sm text-stone-500">No messages yet. Share tips, changes you made, or who liked it.</p>
      ) : (
        <div ref={listRef} className="-mx-1 max-h-[32rem] overflow-y-auto px-1">
          {messages.map((m, i) => {
            const created = new Date(m.createdAt);
            const showDay = days[i] !== days[i - 1];
            const mine = meId !== null && m.author?.id === meId;
            const first = showDay || messages[i - 1]?.author?.id !== m.author?.id;
            // Follow-ups only repeat the time when it moved on from the message before.
            const showTime = !first && times[i] !== times[i - 1];
            return (
              <div key={m.id}>
                {showDay && (
                  <div className={`flex items-center gap-3 text-xs font-medium text-stone-400 ${i > 0 ? "mt-5" : ""} mb-3`}>
                    <span className="h-px flex-1 bg-stone-100" />
                    {days[i]}
                    <span className="h-px flex-1 bg-stone-100" />
                  </div>
                )}
                {first && (
                  <p className={`flex items-center gap-2 text-sm ${showDay ? "" : "mt-4"}`}>
                    <Avatar id={m.author?.id ?? null} name={m.author?.name ?? "?"} size="sm" />
                    <span className="font-semibold text-stone-900">{m.author?.name ?? "Someone"}</span>
                    {mine && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">You</span>}
                    <time
                      dateTime={created.toISOString()}
                      title={created.toLocaleString("en-GB", { timeZone })}
                      className="text-xs text-stone-400 tabular-nums"
                    >
                      {times[i]}
                    </time>
                  </p>
                )}
                <div
                  className={`mt-1.5 ml-8 flex items-start gap-2 rounded-lg px-3 py-2 ${mine ? "bg-emerald-50/70" : "bg-stone-50"}`}
                >
                  <p className="min-w-0 flex-1 leading-relaxed break-words whitespace-pre-wrap text-stone-800">{m.body}</p>
                  {showTime && (
                    <time
                      dateTime={created.toISOString()}
                      title={created.toLocaleString("en-GB", { timeZone })}
                      className="pt-1 text-xs text-stone-400 tabular-nums"
                    >
                      {times[i]}
                    </time>
                  )}
                  {mine && (
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        if (confirm("Delete this message?")) startDelete(() => deleteComment(m.id));
                      }}
                      className="-my-1 -mr-2 rounded-md p-1.5 text-stone-400 transition hover:bg-white hover:text-red-600 disabled:opacity-50"
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <form ref={formRef} action={action} className="mt-4 flex items-end gap-2 border-t border-stone-100 pt-4">
        <textarea
          name="body"
          rows={1}
          required
          maxLength={2000}
          aria-label="Message"
          placeholder={meId ? "Write a message…" : "Pick who you are at the top right to chat"}
          disabled={!meId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="input field-sizing-content max-h-40 min-h-10 flex-1 resize-none disabled:bg-stone-100"
        />
        <button type="submit" disabled={pending || !meId} className="btn-primary" title="Send (Enter)">
          <SendIcon />
          <span className="sr-only sm:not-sr-only">Send</span>
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
