import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setSession, tokenStore, whenSignedOut } from "./api";
import type { ProviderResult } from "./oauth";

type Me = { id: number; name: string };
type SignInResponse = { token: string; user: Me };

type AuthState = {
  ready: boolean;
  me: Me | null;
  signIn: (r: NonNullable<ProviderResult>, inviteCode?: string) => Promise<void>;
  signInWithReviewCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  const clear = useCallback(async () => {
    setSession(null);
    await tokenStore.set(null);
    setMe(null);
  }, []);

  useEffect(() => {
    whenSignedOut(() => void clear());
    (async () => {
      const saved = await tokenStore.get();
      if (saved) {
        setSession(saved);
        try {
          const r = await api<{ user: Me }>("/me");
          setMe(r.user);
        } catch (e) {
          // Offline: keep the session and try again later; a rejected token was cleared by whenSignedOut.
          if ((e as { code?: string }).code === "offline") setMe({ id: 0, name: "" });
        }
      }
      setReady(true);
    })();
  }, [clear]);

  const accept = useCallback(async (r: SignInResponse) => {
    setSession(r.token);
    await tokenStore.set(r.token);
    setMe(r.user);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      me,
      signIn: async (p, inviteCode) => accept(await api<SignInResponse>("/auth/sign-in", { method: "POST", body: { ...p, inviteCode } })),
      signInWithReviewCode: async (code) => accept(await api<SignInResponse>("/auth/review", { method: "POST", body: { code } })),
      signOut: async () => {
        await api("/auth/sign-out", { method: "POST" }).catch(() => {});
        await clear();
      },
      deleteAccount: async () => {
        await api("/me", { method: "DELETE" });
        await clear();
      },
    }),
    [ready, me, accept, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
