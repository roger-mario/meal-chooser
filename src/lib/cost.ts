export type CostItem = {
  name: string;
  /** Price in CHF for the amount the recipe uses (not the whole pack). */
  chf: number;
  /** AI estimates: the product assumed and how the price was worked out (amount × shelf price). */
  product?: string;
  amount?: number;
  unit?: PriceUnit;
  unitPrice?: number;
};

export type PriceUnit = "kg" | "l" | "piece";

export type CostEstimate = {
  store: string;
  items: CostItem[];
  /** "ai" = estimated by the AI provider, "manual" = typed in by the user. */
  source: "ai" | "manual";
  notes?: string;
  model?: string;
  /** Fingerprint of the servings and ingredients the estimate was made for; see estimateBasis(). */
  basis?: string;
};

export const COST_STORE = "Migros";

export function costTotal(cost: CostEstimate) {
  return cost.items.reduce((sum, i) => sum + (Number.isFinite(i.chf) ? i.chf : 0), 0);
}

/** Uses the meal's current servings so the price stays right after editing servings. */
export function costPerServing(cost: CostEstimate | null | undefined, servings: number) {
  if (!cost || cost.items.length === 0) return null;
  return costTotal(cost) / Math.max(1, servings);
}

export function formatChf(value: number) {
  return `CHF ${value.toFixed(2)}`;
}
