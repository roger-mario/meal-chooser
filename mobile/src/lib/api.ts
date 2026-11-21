import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** The Otao website, which is also the app's backend. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

const TOKEN_KEY = "otao.session";

// SecureStore keeps the token in the iOS Keychain. The web preview (for development only) uses localStorage.
export const tokenStore = {
  async get() {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string | null) {
    if (Platform.OS === "web") {
      if (token) globalThis.localStorage?.setItem(TOKEN_KEY, token);
      else globalThis.localStorage?.removeItem(TOKEN_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

let token: string | null = null;
let onSignedOut: (() => void) | null = null;
export function setSession(t: string | null) {
  token = t;
}
export function whenSignedOut(fn: () => void) {
  onSignedOut = fn;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/app${path}`, {
      method: init.method ?? "GET",
      headers: {
        "content-type": "application/json",
        "x-otao-app": String(Constants.expoConfig?.version ?? ""),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0, "offline");
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!res.ok) {
    if (res.status === 401 && token && path !== "/auth/sign-out") onSignedOut?.();
    throw new ApiError(data.error || "Something went wrong.", res.status, data.code || "error");
  }
  return data as T;
}

// Shapes returned by the backend (src/lib/app-api.ts in the website).
export type MealSummary = {
  id: number;
  name: string;
  imageUrl: string | null;
  minutes: number | null;
  servings: number;
  score: number | null;
  scoreLabel: string | null;
  kcal: number | null;
  author: string | null;
  mine: boolean;
  babyFriendly: boolean;
  diet: string | null;
  categories: string[];
  ingredients: string[];
  /** Rough cost of one portion in CHF, or null when there is no estimate yet. */
  costPerServing?: number | null;
};

export type Micro = { key: string; label: string; amount: number; unit: string; pct: number | null; limit: boolean };

export type MealDetail = MealSummary & {
  description: string | null;
  ingredientLines: { text: string; name: string; staple: boolean }[];
  steps: string[];
  links: { url: string; label: string | null; video: boolean }[];
  nutrition: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null; fiber: number | null; micros: Micro[]; estimated: boolean } | null;
  health: { score: number; label: string; parts: { label: string; points: number }[]; badges: { label: string; tone: "good" | "watch"; detail: string }[] } | null;
  bringUrl: string;
  cost?: { currency: string; total: number | null; perServing: number | null; store: string; estimated: boolean; items: { name: string; chf: number | null }[] } | null;
  comments: { id: number; body: string; at: string; author: string | null }[];
};

export type Collection = { id: number; name: string; mealIds: number[] };
export type Library = { me: { id: number; name: string }; meals: MealSummary[]; likedIds: number[]; collections: Collection[] };

export type Slot = "breakfast" | "lunch" | "dinner" | "snack";
export type PlanEntry = { id: number; day: string; slot: Slot; mealId: number | null; label: string | null; cookId: number | null; cook: string | null };
export type Plan = { today: string; from: string; to: string; entries: PlanEntry[]; people: { id: number; name: string }[] };
export type Shopping = { from: string; to: string; lines: { text: string; from: string[] }[]; bringUrl: string | null };
