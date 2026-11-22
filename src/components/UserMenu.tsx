"use client";

import Link from "next/link";
import { useRef, useTransition } from "react";
import { switchUser } from "@/app/actions/users";
import { Avatar } from "./Avatar";
import { Icon } from "./v7/Icons";

type Person = { id: number; name: string };

/** Avatar at the top right; opens a small list to switch who is using the app. */
export function UserMenu({ users, current }: { users: Person[]; current: Person | null }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [pending, start] = useTransition();
  return (
    <details ref={ref} className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-full py-0.5 pr-3 pl-0.5 hover:bg-sand"
        title="Switch user"
      >
        {current ? <Avatar id={current.id} name={current.name} /> : <Avatar id={null} name="?" />}
        <span className="hidden text-sm font-bold text-ink2 sm:inline">{current?.name ?? "Who are you?"}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-52 rounded-[18px] border border-line bg-white p-1.5 text-sm shadow-[0_12px_32px_rgba(42,38,34,0.12)]">
        <p className="px-2.5 pt-1.5 pb-1 text-xs font-semibold text-muted">Using the app as</p>
        {users.map((u) => (
          <button
            key={u.id}
            disabled={pending}
            onClick={() =>
              start(async () => {
                await switchUser(u.id);
                ref.current?.removeAttribute("open");
              })
            }
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-semibold hover:bg-sand disabled:opacity-60"
          >
            <Avatar id={u.id} name={u.name} size="sm" />
            <span className="flex-1">{u.name}</span>
            {current?.id === u.id && <span className="text-coral-ink">✓</span>}
          </button>
        ))}
        <div className="my-1 border-t border-line" />
        <Link
          href="/you"
          onClick={() => ref.current?.removeAttribute("open")}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold hover:bg-sand"
        >
          <Icon.you className="h-5 w-5 text-muted" />
          <span className="flex-1">You, collections and settings</span>
        </Link>
      </div>
    </details>
  );
}
