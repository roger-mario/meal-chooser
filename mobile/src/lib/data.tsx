import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Collection, type Library, type MealSummary } from "./api";
import { useAuth } from "./auth";

type DataState = {
  library: Library | null;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  meal: (id: number | null | undefined) => MealSummary | undefined;
  isLiked: (id: number) => boolean;
  toggleLike: (id: number) => void;
  inAnyCollection: (id: number) => boolean;
  toggleInCollection: (collectionId: number, mealId: number) => void;
  createCollection: (name: string, mealId?: number) => Promise<Collection | null>;
  deleteCollection: (id: number) => Promise<void>;
};

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setLibrary(await api<Library>("/library"));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    api<Library>("/library").then(
      (l) => alive && setLibrary(l),
      (e: Error) => alive && setError(e.message),
    );
    return () => {
      alive = false;
    };
  }, [me]);

  const value = useMemo<DataState>(() => {
    const byId = new Map(library?.meals.map((m) => [m.id, m]));
    const liked = new Set(library?.likedIds);
    const patch = (fn: (l: Library) => Library) => setLibrary((l) => (l ? fn(l) : l));
    return {
      library: me ? library : null,
      error,
      refreshing,
      refresh,
      meal: (id) => (id == null ? undefined : byId.get(id)),
      isLiked: (id) => liked.has(id),
      // Optimistic: the heart fills at once; a failed request puts it back.
      toggleLike: (id) => {
        const on = !liked.has(id);
        patch((l) => ({ ...l, likedIds: on ? [...l.likedIds, id] : l.likedIds.filter((x) => x !== id) }));
        api(`/meals/${id}/like`, { method: on ? "PUT" : "DELETE" }).catch(() =>
          patch((l) => ({ ...l, likedIds: on ? l.likedIds.filter((x) => x !== id) : [...l.likedIds, id] })),
        );
      },
      inAnyCollection: (id) => !!library?.collections.some((c) => c.mealIds.includes(id)),
      toggleInCollection: (collectionId, mealId) => {
        const c = library?.collections.find((x) => x.id === collectionId);
        if (!c) return;
        const on = !c.mealIds.includes(mealId);
        const apply = (add: boolean) =>
          patch((l) => ({
            ...l,
            collections: l.collections.map((x) =>
              x.id === collectionId ? { ...x, mealIds: add ? [...x.mealIds.filter((m) => m !== mealId), mealId] : x.mealIds.filter((m) => m !== mealId) } : x,
            ),
          }));
        apply(on);
        api(`/collections/${collectionId}/meals/${mealId}`, { method: on ? "PUT" : "DELETE" }).catch(() => apply(!on));
      },
      createCollection: async (name, mealId) => {
        const c = await api<Collection>("/collections", { method: "POST", body: { name, mealId } });
        patch((l) => ({ ...l, collections: [...l.collections, c] }));
        return c;
      },
      deleteCollection: async (id) => {
        await api(`/collections/${id}`, { method: "DELETE" });
        patch((l) => ({ ...l, collections: l.collections.filter((c) => c.id !== id) }));
      },
    };
  }, [library, error, refreshing, refresh, me]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData outside DataProvider");
  return v;
}
