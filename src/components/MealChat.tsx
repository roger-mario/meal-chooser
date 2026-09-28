"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteComment, sendComment, type ChatState } from "@/app/actions/comments";
import { nameColor } from "@/lib/avatar";
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

/** The little corner that makes a bubble point at its sender. */
function Tail({ mine }: { mine: boolean }) {
  return (
    <svg
      viewBox="0 0 8 13"
      className={`absolute top-0 h-[13px] w-2 ${mine ? "-right-2 text-[#d9fdd3]" : "-left-2 -scale-x-100 text-white"}`}
      aria-hidden
    >
      <path fill="currentColor" d="M0 0h8L1.5 9.5C1 10.3 0 10 0 9z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
    </svg>
  );
}

/** WhatsApp-style chat on a meal: own messages green on the right, everyone else's white on the left. */
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
    <div className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm">
      <div
        ref={listRef}
        className="max-h-[32rem] min-h-48 overflow-y-auto bg-[#efeae2] px-3 py-3 sm:px-6"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      >
        {messages.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <p className="rounded-lg bg-[#fff5c4] px-4 py-2 text-center text-sm text-stone-600 shadow-sm">
              No messages yet. Share tips, changes you made, or who liked it. 🍽️
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const created = new Date(m.createdAt);
          const showDay = days[i] !== days[i - 1];
          const mine = meId !== null && m.author?.id === meId;
          const first = showDay || messages[i - 1]?.author?.id !== m.author?.id;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center">
                  <span className="rounded-lg bg-white/95 px-3 py-1 text-xs font-medium text-stone-500 shadow-sm">
                    {days[i]}
                  </span>
                </p>
              )}
              <div
                className={`group flex items-start gap-2 ${mine ? "flex-row-reverse" : ""} ${first ? "mt-2.5" : "mt-0.5"}`}
              >
                {!mine && (
                  <span className={`mt-0.5 ${first ? "" : "invisible"}`}>
                    <Avatar id={m.author?.id ?? null} name={m.author?.name ?? "?"} size="sm" />
                  </span>
                )}
                <div
                  className={`relative max-w-[78%] rounded-lg px-2.5 pt-1.5 pb-1 text-[15px] leading-snug text-stone-900 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] sm:max-w-[65%] ${
                    mine ? "bg-[#d9fdd3]" : "bg-white"
                  } ${first ? (mine ? "rounded-tr-none" : "rounded-tl-none") : ""}`}
                >
                  {first && <Tail mine={mine} />}
                  {first && (
                    <p className={`mb-0.5 text-[13px] font-semibold ${nameColor(m.author?.id)}`}>
                      {m.author?.name ?? "Someone"}
                    </p>
                  )}
                  <p className="break-words whitespace-pre-wrap">
                    {m.body}
                    {/* Reserves room so the time never overlaps the last line. */}
                    <span className="inline-block w-14" aria-hidden />
                  </p>
                  <p className="-mt-3.5 flex items-center justify-end gap-1 text-[11px] leading-none text-stone-500">
                    <time dateTime={created.toISOString()} title={created.toLocaleString("en-GB", { timeZone })}>
                      {time(created, timeZone)}
                    </time>
                    {mine && <span className="text-sky-500">✓✓</span>}
                  </p>
                </div>
                {mine && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      if (confirm("Delete this message?")) startDelete(() => deleteComment(m.id));
                    }}
                    className="mt-1 rounded-full p-1 text-xs text-stone-500 opacity-0 transition group-hover:opacity-100 hover:bg-white/70 hover:text-red-600 focus:opacity-100"
                    title="Delete message"
                    aria-label="Delete message"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form ref={formRef} action={action} className="flex items-end gap-2 bg-[#f0f2f5] px-3 py-2.5">
        <textarea
          name="body"
          rows={1}
          required
          maxLength={2000}
          placeholder={meId ? "Type a message" : "Pick who you are at the top right to chat"}
          disabled={!meId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="field-sizing-content max-h-40 min-h-11 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-[15px] shadow-sm outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-600/30 disabled:bg-stone-100"
        />
        <button
          type="submit"
          disabled={pending || !meId}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-sm transition hover:bg-[#008f72] disabled:opacity-50"
          aria-label="Send"
          title="Send (Enter)"
        >
          <SendIcon />
        </button>
      </form>
      {state?.error && <p className="bg-[#f0f2f5] px-4 pb-3 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
