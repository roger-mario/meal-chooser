import { NUTRIENTS, POORLY_TABULATED, type NutritionEstimate } from "./nutrients";

export type Badge = { key: string; emoji: string; label: string; tone: "good" | "watch"; detail: string };

export type Health = {
  /** 0–100: how much good nutrition one serving brings, minus what's worth limiting. */
  score: number;
  label: "Great" | "Good" | "OK" | "Treat";
  badges: Badge[];
  /** Different plant foods in the meal, when the estimate knows (newer AI estimates do). */
  plants: number | null;
  /** Each part of the score, for the "why" list on the meal page. */
  parts: { label: string; points: number }[];
};

const LIMITS = new Set(["sodium", "saturatedFat", "addedSugars", "cholesterol"]);

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/**
 * Scores one serving. The weights follow what long-term studies link with healthy ageing:
 * protein, fibre and plant variety, many vitamins and minerals, omega-3, and little salt,
 * saturated fat, added sugar and ultra-processed food.
 */
export function mealHealth(nutrition: NutritionEstimate | null | undefined): Health | null {
  const v = nutrition?.perServing;
  if (!v || v.calories == null) return null;
  const protein = v.protein ?? 0;
  const fiber = v.fiber ?? 0;
  const omega3 = v.omega3 ?? 0;
  const sodium = v.sodium ?? 0;
  const satFat = v.saturatedFat ?? 0;
  const added = v.addedSugars ?? 0;

  const plantItems = nutrition.ingredients?.filter((i) => i.plant != null && i.grams > 0);
  const plants = plantItems?.length ? plantItems.filter((i) => i.plant).length : null;
  const ultra = nutrition.ingredients?.filter((i) => i.processing === "ultra" && i.grams >= 10).length ?? 0;

  // Vitamins and minerals the dish is dense in: 20%+ of the daily value, and at least 1.5× the
  // share of the day's calories, so a big portion doesn't count as nutritious just for being big.
  const richShare = Math.max(0.2, (1.5 * v.calories) / 2000);
  const rich = NUTRIENTS.filter(
    (n) =>
      (n.group === "vitamins" || n.group === "minerals") &&
      !LIMITS.has(n.key) &&
      !POORLY_TABULATED.has(n.key) &&
      "dailyValue" in n &&
      (v[n.key] ?? 0) / n.dailyValue >= richShare,
  );

  const parts = [
    { label: "Protein", points: Math.round(15 * clamp(protein / 30)) },
    { label: "Fibre", points: Math.round(20 * clamp(fiber / 10)) },
    { label: "Vitamins & minerals", points: Math.round(20 * clamp(rich.length / 10)) },
    { label: "Plant variety", points: plants == null ? 5 : Math.round(15 * clamp(plants / 6)) },
    { label: "Omega-3", points: Math.round(10 * clamp(omega3 / 1.5)) },
    { label: "Salt", points: -Math.round(15 * clamp((sodium - 600) / 900)) },
    { label: "Saturated fat", points: -Math.round(10 * clamp((satFat - 5) / 7)) },
    { label: "Added sugar", points: -Math.round(10 * clamp((added - 5) / 20)) },
    { label: "Ultra-processed", points: -Math.min(10, ultra * 5) },
  ];
  // A neutral base, so a plain but harmless dish lands in the middle.
  const score = Math.round(clamp(20 + parts.reduce((s, p) => s + p.points, 0), 0, 100));

  const badges: Badge[] = [];
  if (protein >= 25) badges.push({ key: "protein", emoji: "💪", label: "Protein-rich", tone: "good", detail: `${Math.round(protein)} g protein` });
  if (fiber >= 8) badges.push({ key: "fiber", emoji: "🌾", label: "High fibre", tone: "good", detail: `${Math.round(fiber)} g fibre` });
  if (omega3 >= 1) badges.push({ key: "omega3", emoji: "🐟", label: "Omega-3", tone: "good", detail: `${omega3.toFixed(1)} g omega-3` });
  if (plants != null && plants >= 5) badges.push({ key: "plants", emoji: "🌱", label: `${plants} plants`, tone: "good", detail: `${plants} different plant foods` });
  if (rich.length >= 8) badges.push({ key: "micros", emoji: "✨", label: "Nutrient-dense", tone: "good", detail: `${rich.length} vitamins & minerals well above their share of calories` });
  if (sodium >= 1000) badges.push({ key: "salt", emoji: "🧂", label: "Salty", tone: "watch", detail: `${Math.round(sodium)} mg sodium` });
  if (satFat >= 10) badges.push({ key: "satfat", emoji: "🧈", label: "Rich in sat. fat", tone: "watch", detail: `${Math.round(satFat)} g saturated fat` });
  if (added >= 12.5) badges.push({ key: "sugar", emoji: "🍬", label: "Sugary", tone: "watch", detail: `${Math.round(added)} g added sugar` });

  const label = score >= 75 ? "Great" : score >= 55 ? "Good" : score >= 35 ? "OK" : "Treat";
  return { score, label, badges, plants, parts };
}

export function scoreColor(score: number) {
  if (score >= 75) return "bg-emerald-600 text-white";
  if (score >= 55) return "bg-lime-500 text-white";
  if (score >= 35) return "bg-amber-400 text-stone-900";
  return "bg-orange-500 text-white";
}
