import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Settings kept on this phone: how you use Otao, food preferences, what's at home. */
export type Prefs = {
  usage: "plan" | "recipes";
  onboarded: boolean;
  bannerHidden: boolean;
  likes: string[];
  avoid: string[];
  household: number;
  littleOne: boolean;
  pantry: string[];
};

const DEFAULTS: Prefs = { usage: "plan", onboarded: false, bannerHidden: false, likes: [], avoid: [], household: 2, littleOne: false, pantry: [] };
const KEY = "otao.prefs.v1";

type PrefsState = { prefs: Prefs; loaded: boolean; update: (p: Partial<Prefs>) => void };
const Ctx = createContext<PrefsState | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  const value = useMemo<PrefsState>(
    () => ({
      prefs,
      loaded,
      update: (p) =>
        setPrefs((old) => {
          const next = { ...old, ...p };
          AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
          return next;
        }),
    }),
    [prefs, loaded],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs outside PrefsProvider");
  return v;
}

/** "chicken, spinach" → ["chicken", "spinach"], lowercased and without duplicates. */
export function parsePantry(text: string, existing: string[]) {
  const out = [...existing];
  for (const raw of text.split(/[,;\n]/)) {
    const item = raw.trim().toLowerCase();
    if (item && !out.includes(item)) out.push(item);
  }
  return out;
}

const key = (s: string) => {
  let n = s.trim().toLowerCase();
  n = n.replace(/\s*\(.*\)$/, "");
  if (n.endsWith("oes")) n = n.slice(0, -2);
  else if (n.endsWith("ies")) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss")) n = n.slice(0, -1);
  return n;
};

/** Whether something at home covers a recipe ingredient ("chicken" covers "chicken thighs"). */
export function atHome(pantry: string[], ingredient: string) {
  const need = key(ingredient);
  return pantry.some((p) => {
    const have = key(p);
    return have.length > 1 && (need === have || need.includes(have) || have.includes(need));
  });
}

/** How many ingredients of a recipe are at home, and which are missing. */
export function pantryMatch(m: { ingredients: string[] }, pantry: string[]) {
  const missing = m.ingredients.filter((i) => !atHome(pantry, i));
  return { have: m.ingredients.length - missing.length, total: m.ingredients.length, missing };
}
