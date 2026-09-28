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

/** Chat-style comments on a meal: own messages on the right, everyone else's on the left. */
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
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
      <div ref={listRef} className="max-h-[28rem] space-y-1.5 overflow-y-auto px-3 py-4 sm:px-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-stone-400">
            No messages yet. Share tips, changes you made, or who liked it.
          </p>
        )}
        {messages.map((m, i) => {
          const created = new Date(m.createdAt);
          const day = days[i];
          const showDay = day !== days[i - 1];
          const mine = meId !== null && m.author?.id === meId;
          const prev = messages[i - 1];
          const grouped = !showDay && prev && prev.author?.id === m.author?.id;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center">
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-500 shadow-sm">{day}</span>
                </p>
              )}
              <div className={`group flex items-end gap-2 ${mine ? "flex-row-reverse" : ""} ${grouped ? "" : "pt-1.5"}`}>
                {!mine && (
                  <span className={grouped ? "invisible" : ""}>
                    <Avatar id={m.author?.id ?? null} name={m.author?.name ?? "?"} size="sm" />
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${
                    mine ? "rounded-br-md bg-emerald-600 text-white" : "rounded-bl-md bg-white text-stone-800"
                  }`}
                >
                  {!mine && !grouped && (
                    <p className="mb-0.5 text-xs font-semibold text-stone-500">{m.author?.name ?? "Someone"}</p>
                  )}
                  <p className="break-words whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-0.5 text-right text-[11px] ${mine ? "text-emerald-100" : "text-stone-400"}`}>
                    <time dateTime={created.toISOString()}>{time(created, timeZone)}</time>
                  </p>
                </div>
                {mine && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      if (confirm("Delete this message?")) startDelete(() => deleteComment(m.id));
                    }}
                    className="self-center text-xs text-stone-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600"
                    title="Delete message"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form ref={formRef} action={action} className="flex items-end gap-2 border-t border-stone-200 bg-white p-2.5">
        <textarea
          name="body"
          rows={1}
          required
          maxLength={2000}
          placeholder={meId ? "Write a message…" : "Pick who you are at the top right to chat"}
          disabled={!meId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="input max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-2xl field-sizing-content"
        />
        <button
          type="submit"
          disabled={pending || !meId}
          className="btn-primary h-11 w-11 shrink-0 justify-center rounded-full p-0 text-lg"
          aria-label="Send"
          title="Send (Enter)"
        >
          ➤
        </button>
      </form>
      {state?.error && <p className="bg-white px-4 pb-3 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
