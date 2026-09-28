import { PantryMatcher } from "@/components/PantryMatcher";
import { ingredientKey } from "@/lib/meal-fields";
import { listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CookPage() {
  const meals = await listMeals();
  const known = new Map<string, string>();
  for (const m of meals) {
    for (const i of m.ingredients) {
      if (!i.staple && !known.has(ingredientKey(i.name))) known.set(ingredientKey(i.name), i.name.toLowerCase());
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What can I cook?</h1>
        <p className="text-stone-600">Add what you have at home and see which meals you can (almost) make.</p>
      </div>
      <PantryMatcher
        meals={meals.map((m) => ({
          id: m.id,
          name: m.name,
          imageUrl: m.imageUrl,
          ingredients: m.ingredients.filter((i) => !i.staple).map((i) => i.name),
        }))}
        suggestions={[...known.values()].sort()}
      />
    </div>
  );
}
