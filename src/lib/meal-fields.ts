export const UNITS = [
  { value: "", label: "—" },
  { value: "pcs", label: "pcs" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "clove", label: "clove" },
  { value: "slice", label: "slice" },
  { value: "can", label: "can" },
  { value: "bunch", label: "bunch" },
  { value: "pinch", label: "pinch" },
  { value: "to taste", label: "to taste" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];

export type Ingredient = {
  name: string;
  quantity?: number;
  unit?: string;
  /** Basics like salt, pepper or oil: ignored when matching against what you have. */
  staple?: boolean;
};

export type MealLink = { url: string; label?: string };

/** Accepts only http(s) URLs; adds https:// when the scheme is missing. */
export function cleanUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function linkIcon(url: string) {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (/youtube\.com|youtu\.be|vimeo\.com|tiktok\.com/.test(host)) return "▶️";
  if (/instagram\.com|pinterest\./.test(host)) return "📸";
  return "🔗";
}

export function linkLabel(link: MealLink) {
  if (link.label) return link.label;
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;
export type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export const DIETS = [
  { value: "vegetarian", label: "Vegetarian", emoji: "🥕" },
  { value: "vegan", label: "Vegan", emoji: "🌱" },
] as const;
export type Diet = (typeof DIETS)[number]["value"];

const STAPLE_WORDS = [
  "salt", "pepper", "oil", "olive oil", "water", "sugar", "flour", "butter",
  "vinegar", "paprika", "oregano", "cumin", "chili flakes", "baking powder",
];

export function looksLikeStaple(name: string) {
  const n = name.trim().toLowerCase();
  return STAPLE_WORDS.some((w) => n === w || n.endsWith(` ${w}`));
}

const LEGACY_LINE = /^\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+\.?)?\s+(.+)$/;

/** Accepts the old string format and returns structured ingredients. */
export function normalizeIngredients(items: (Ingredient | string)[] | null | undefined): Ingredient[] {
  return (items ?? []).map((item) => {
    if (typeof item !== "string") return item;
    const m = item.match(LEGACY_LINE);
    const unit = m?.[2]?.replace(".", "").toLowerCase();
    const known = UNITS.some((u) => u.value === unit);
    if (m && (!m[2] || known)) {
      return { name: m[3], quantity: Number(m[1].replace(",", ".")), unit: unit || "pcs", staple: looksLikeStaple(m[3]) };
    }
    return { name: item, staple: looksLikeStaple(item) };
  });
}

export function normalizeSteps(steps: string[] | null | undefined, legacy?: string | null): string[] {
  if (steps && steps.length) return steps;
  return (legacy ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

export function formatQuantity(i: Ingredient) {
  if (i.unit === "to taste") return "to taste";
  if (i.quantity == null) return i.unit && i.unit !== "pcs" ? i.unit : "";
  const q = Number.isInteger(i.quantity) ? i.quantity : Math.round(i.quantity * 100) / 100;
  return !i.unit || i.unit === "pcs" ? `${q}` : `${q} ${i.unit}`;
}

export function formatIngredient(i: Ingredient) {
  const q = formatQuantity(i);
  return q ? `${q} ${i.name}` : i.name;
}

export function totalMinutes(m: { prepMinutes: number | null; cookMinutes: number | null }) {
  const t = (m.prepMinutes ?? 0) + (m.cookMinutes ?? 0);
  return t > 0 ? t : null;
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Lowercase, drop simple plural endings, so "Onions" matches "onion". */
export function ingredientKey(name: string) {
  let n = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (n.endsWith("oes")) n = n.slice(0, -2);
  else if (n.endsWith("ies")) n = n.slice(0, -3) + "y";
  else if (n.endsWith("s") && !n.endsWith("ss")) n = n.slice(0, -1);
  return n;
}

/** True when two ingredient names refer to the same thing ("beef" ~ "minced beef"). */
export function ingredientsMatch(have: string, need: string) {
  const a = ingredientKey(have);
  const b = ingredientKey(need);
  if (!a || !b) return false;
  if (a === b) return true;
  const words = (s: string) => s.split(" ");
  return words(b).includes(a) || words(a).includes(b);
}

/** Cleans ingredient rows from forms, the API or backups. */
export function sanitizeIngredients(items: unknown): Ingredient[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((raw) => {
    const i = (typeof raw === "string" ? normalizeIngredients([raw])[0] : raw) as Partial<Ingredient> | null;
    const name = typeof i?.name === "string" ? i.name.trim() : "";
    if (!name) return [];
    const quantity = Number(i?.quantity);
    return [
      {
        name,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
        unit: UNITS.some((u) => u.value && u.value === i?.unit) ? i?.unit : undefined,
        staple: typeof i?.staple === "boolean" ? i.staple : looksLikeStaple(name),
      },
    ];
  });
}

export function sanitizeLinks(items: unknown): MealLink[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((raw) => {
    const l = (typeof raw === "string" ? { url: raw } : raw) as Partial<MealLink> | null;
    const url = cleanUrl(String(l?.url ?? ""));
    if (!url) return [];
    const label = typeof l?.label === "string" && l.label.trim() ? l.label.trim() : undefined;
    return [{ url, label }];
  });
}
