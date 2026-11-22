import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { api, type Plan, type Slot } from "./api";

/** The shared plan for a range of days, reloaded whenever the screen comes back into view. */
export function usePlan(from: string, to: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setPlan(await api<Plan>(`/plan?from=${from}&to=${to}`));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [from, to]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return { plan, error, reload: load, setPlan };
}

export async function addToPlan(day: string, slot: Slot, mealId: number) {
  return api<{ id: number }>("/plan", { method: "POST", body: { day, slot, mealId } });
}
export async function removeFromPlan(id: number) {
  return api(`/plan/${id}`, { method: "DELETE" });
}
export async function fillGaps(from: string, to: string) {
  return api<{ added: number[] }>("/plan/fill", { method: "POST", body: { from, to } });
}

export const SLOT_LABEL: Record<Slot, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
export const SLOT_ORDER: Slot[] = ["breakfast", "lunch", "dinner", "snack"];
