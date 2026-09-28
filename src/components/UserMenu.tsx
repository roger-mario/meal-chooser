"use client";

import { useRef, useTransition } from "react";
import { switchUser } from "@/app/actions/users";
import { Avatar } from "./Avatar";

type Person = { id: number; name: string };

/** Avatar at the top right; opens a small list to switch who is using the app. */
export function UserMenu({ users, current }: { users: Person[]; current: Person | null }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [pending, start] = useTransition();
  return (
    <details ref={ref} className="relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-full py-0.5 pr-3 pl-0.5 ring-emerald-600 hover:bg-stone-100"
        title="Switch user"
      >
        {current ? <Avatar id={current.id} name={current.name} /> : <Avatar id={null} name="?" />}
        <span className="hidden text-sm font-medium text-stone-700 sm:inline">{current?.name ?? "Who are you?"}</span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-stone-200 bg-white p-1.5 text-sm shadow-lg">
        <p className="px-2.5 pt-1.5 pb-1 text-xs text-stone-500">Using the app as</p>
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
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-stone-100 disabled:opacity-60"
          >
            <Avatar id={u.id} name={u.name} size="sm" />
            <span className="flex-1">{u.name}</span>
            {current?.id === u.id && <span className="text-emerald-700">✓</span>}
          </button>
        ))}
      </div>
    </details>
  );
}
