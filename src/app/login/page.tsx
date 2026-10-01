import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Otao" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="card w-full max-w-sm space-y-6 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={72} height={72} className="h-18 w-18 drop-shadow-sm" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Otao</h1>
            <p className="text-sm text-stone-500">Enter the password once. This device will remember it.</p>
          </div>
        </div>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  );
}
