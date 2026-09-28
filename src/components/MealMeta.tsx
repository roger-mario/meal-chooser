import { DIETS, DIFFICULTIES, formatMinutes, totalMinutes, type Diet, type Difficulty } from "@/lib/meal-fields";

const DIFFICULTY_ICON: Record<Difficulty, string> = { easy: "●○○", medium: "●●○", hard: "●●●" };

export function MealMeta({
  meal,
  detailed = false,
}: {
  meal: { prepMinutes: number | null; cookMinutes: number | null; difficulty: Difficulty | null; diet: Diet | null; servings: number };
  detailed?: boolean;
}) {
  const total = totalMinutes(meal);
  const diet = DIETS.find((d) => d.value === meal.diet);
  const difficulty = DIFFICULTIES.find((d) => d.value === meal.difficulty);
  const items: string[] = [];
  if (total) items.push(`⏱ ${formatMinutes(total)}`);
  if (detailed && meal.prepMinutes) items.push(`Prep ${formatMinutes(meal.prepMinutes)}`);
  if (detailed && meal.cookMinutes) items.push(`Cook ${formatMinutes(meal.cookMinutes)}`);
  if (difficulty) items.push(`${DIFFICULTY_ICON[difficulty.value]} ${difficulty.label}`);
  if (detailed) items.push(`🍽 ${meal.servings} serving${meal.servings === 1 ? "" : "s"}`);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
      {items.map((i) => (
        <span key={i}>{i}</span>
      ))}
      {diet && (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          {diet.emoji} {diet.label}
        </span>
      )}
    </div>
  );
}
