"use client";

import { useTransition } from "react";
import { switchUser } from "@/app/actions/users";
import { Avatar } from "./Avatar";

/** Shown once per browser until someone picks who they are. */
export function WhoAreYou({ users }: { users: { id: number; name: string }[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-sm p-6 text-center">
        <p className="text-4xl">👋</p>
        <h2 className="mt-2 text-lg font-semibold">Who are you?</h2>
        <p className="mt-1 text-sm text-stone-500">
          Your name goes on the meals you add and your chat messages. You can switch any time at the top right.
        </p>
        <div className="mt-5 grid gap-2">
          {users.map((u) => (
            <button
              key={u.id}
              disabled={pending}
              onClick={() => start(() => switchUser(u.id))}
              className="btn justify-start gap-3 py-3 text-base"
            >
              <Avatar id={u.id} name={u.name} />
              {u.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
