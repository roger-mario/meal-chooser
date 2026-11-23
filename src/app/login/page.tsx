import type { Metadata } from "next";
import { Mark } from "@/components/v7/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Otao" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-sky px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Mark width={128} animated className="drop-shadow-[0_14px_28px_rgba(6,78,59,0.25)]" />
          <h1 className="text-4xl font-extrabold tracking-tight">otao</h1>
          <p className="text-[15px] text-ink2">Healthy home cooking, planned together. Otao is invite-only for now.</p>
        </div>
        <div className="card space-y-4 p-5 shadow-[0_12px_32px_rgba(31,90,138,0.12)]">
          <LoginForm next={typeof next === "string" ? next : "/"} />
        </div>
      </div>
    </main>
  );
}
