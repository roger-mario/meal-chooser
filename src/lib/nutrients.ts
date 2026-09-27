export type NutrientGroup = "energy" | "macros" | "fats" | "vitamins" | "minerals";

export type NutrientDef = {
  key: string;
  label: string;
  unit: string;
  group: NutrientGroup;
  /** Adult daily value / reference intake, used for the % column. */
  dailyValue?: number;
};

// Daily values follow the US FDA reference values for adults (2020 labels);
// omega-3/6 and fluoride use adequate intakes.
export const NUTRIENTS = [
  { key: "calories", label: "Calories", unit: "kcal", group: "energy", dailyValue: 2000 },

  { key: "protein", label: "Protein", unit: "g", group: "macros", dailyValue: 50 },
  { key: "carbohydrates", label: "Carbohydrates", unit: "g", group: "macros", dailyValue: 275 },
  { key: "fiber", label: "Fiber", unit: "g", group: "macros", dailyValue: 28 },
  { key: "sugars", label: "Sugars", unit: "g", group: "macros" },
  { key: "addedSugars", label: "Added sugars", unit: "g", group: "macros", dailyValue: 50 },

  { key: "fat", label: "Total fat", unit: "g", group: "fats", dailyValue: 78 },
  { key: "saturatedFat", label: "Saturated fat", unit: "g", group: "fats", dailyValue: 20 },
  { key: "monounsaturatedFat", label: "Monounsaturated fat", unit: "g", group: "fats" },
  { key: "polyunsaturatedFat", label: "Polyunsaturated fat", unit: "g", group: "fats" },
  { key: "omega3", label: "Omega-3 (ALA+EPA+DHA)", unit: "g", group: "fats", dailyValue: 1.6 },
  { key: "omega6", label: "Omega-6", unit: "g", group: "fats", dailyValue: 17 },
  { key: "transFat", label: "Trans fat", unit: "g", group: "fats" },
  { key: "cholesterol", label: "Cholesterol", unit: "mg", group: "fats", dailyValue: 300 },

  { key: "vitaminA", label: "Vitamin A (RAE)", unit: "µg", group: "vitamins", dailyValue: 900 },
  { key: "vitaminC", label: "Vitamin C", unit: "mg", group: "vitamins", dailyValue: 90 },
  { key: "vitaminD", label: "Vitamin D", unit: "µg", group: "vitamins", dailyValue: 20 },
  { key: "vitaminE", label: "Vitamin E", unit: "mg", group: "vitamins", dailyValue: 15 },
  { key: "vitaminK", label: "Vitamin K", unit: "µg", group: "vitamins", dailyValue: 120 },
  { key: "thiamin", label: "Thiamin (B1)", unit: "mg", group: "vitamins", dailyValue: 1.2 },
  { key: "riboflavin", label: "Riboflavin (B2)", unit: "mg", group: "vitamins", dailyValue: 1.3 },
  { key: "niacin", label: "Niacin (B3)", unit: "mg", group: "vitamins", dailyValue: 16 },
  { key: "pantothenicAcid", label: "Pantothenic acid (B5)", unit: "mg", group: "vitamins", dailyValue: 5 },
  { key: "vitaminB6", label: "Vitamin B6", unit: "mg", group: "vitamins", dailyValue: 1.7 },
  { key: "biotin", label: "Biotin (B7)", unit: "µg", group: "vitamins", dailyValue: 30 },
  { key: "folate", label: "Folate (B9, DFE)", unit: "µg", group: "vitamins", dailyValue: 400 },
  { key: "vitaminB12", label: "Vitamin B12", unit: "µg", group: "vitamins", dailyValue: 2.4 },
  { key: "choline", label: "Choline", unit: "mg", group: "vitamins", dailyValue: 550 },

  { key: "calcium", label: "Calcium", unit: "mg", group: "minerals", dailyValue: 1300 },
  { key: "iron", label: "Iron", unit: "mg", group: "minerals", dailyValue: 18 },
  { key: "magnesium", label: "Magnesium", unit: "mg", group: "minerals", dailyValue: 420 },
  { key: "phosphorus", label: "Phosphorus", unit: "mg", group: "minerals", dailyValue: 1250 },
  { key: "potassium", label: "Potassium", unit: "mg", group: "minerals", dailyValue: 4700 },
  { key: "sodium", label: "Sodium", unit: "mg", group: "minerals", dailyValue: 2300 },
  { key: "chloride", label: "Chloride", unit: "mg", group: "minerals", dailyValue: 2300 },
  { key: "zinc", label: "Zinc", unit: "mg", group: "minerals", dailyValue: 11 },
  { key: "copper", label: "Copper", unit: "mg", group: "minerals", dailyValue: 0.9 },
  { key: "manganese", label: "Manganese", unit: "mg", group: "minerals", dailyValue: 2.3 },
  { key: "selenium", label: "Selenium", unit: "µg", group: "minerals", dailyValue: 55 },
  { key: "iodine", label: "Iodine", unit: "µg", group: "minerals", dailyValue: 150 },
  { key: "chromium", label: "Chromium", unit: "µg", group: "minerals", dailyValue: 35 },
  { key: "molybdenum", label: "Molybdenum", unit: "µg", group: "minerals", dailyValue: 45 },
  { key: "fluoride", label: "Fluoride", unit: "mg", group: "minerals", dailyValue: 4 },
] as const satisfies readonly NutrientDef[];

export type NutrientKey = (typeof NUTRIENTS)[number]["key"];

export const NUTRIENT_GROUPS: { group: NutrientGroup; label: string }[] = [
  { group: "energy", label: "Energy" },
  { group: "macros", label: "Macronutrients" },
  { group: "fats", label: "Fats" },
  { group: "vitamins", label: "Vitamins" },
  { group: "minerals", label: "Minerals" },
];

export type NutritionEstimate = {
  /** Values are per single serving. */
  perServing: Record<NutrientKey, number>;
  servings: number;
  confidence: "low" | "medium" | "high";
  summary: string;
  assumptions: string[];
  model: string;
};
