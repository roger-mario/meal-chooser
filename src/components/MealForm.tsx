import type { Category } from "@/db/schema";
import type { MealWithCategories } from "@/lib/queries";
import { ImageInput } from "./ImageInput";
import { SubmitButton } from "./SubmitButton";

export function MealForm({
  action,
  categories,
  meal,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Category[];
  meal?: MealWithCategories;
}) {
  const selected = new Set(meal?.categories.map((c) => c.id));
  return (
    <form action={action} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="name">Name</label>
        <input id="name" name="name" required defaultValue={meal?.name} className="input" />
      </div>

      <div>
        <label className="label" htmlFor="description">Short description</label>
        <input id="description" name="description" defaultValue={meal?.description ?? ""} className="input" />
      </div>

      <div>
        <span className="label">Picture</span>
        <ImageInput currentUrl={meal?.imageUrl} />
        {meal?.imageUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" name="removeImage" /> Remove current picture
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="servings">Servings</label>
          <input id="servings" name="servings" type="number" min={1} defaultValue={meal?.servings ?? 2} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="prepMinutes">Time (minutes)</label>
          <input id="prepMinutes" name="prepMinutes" type="number" min={1} defaultValue={meal?.prepMinutes ?? ""} className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ingredients">Shopping list (one ingredient per line, with amounts)</label>
        <textarea
          id="ingredients"
          name="ingredients"
          rows={8}
          defaultValue={meal?.ingredients.join("\n")}
          placeholder={"400 g spaghetti\n2 tbsp olive oil\n3 cloves garlic"}
          className="input font-mono"
        />
        <p className="mt-1 text-xs text-stone-500">Exact amounts make the nutrition estimate much more accurate.</p>
      </div>

      <div>
        <label className="label" htmlFor="instructions">Cooking instructions</label>
        <textarea id="instructions" name="instructions" rows={10} defaultValue={meal?.instructions ?? ""} className="input" />
      </div>

      <fieldset>
        <legend className="label">Categories</legend>
        {categories.length === 0 ? (
          <p className="text-sm text-stone-500">No categories yet. Create some on the Categories page.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selected.has(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <SubmitButton>{meal ? "Save changes" : "Add meal"}</SubmitButton>
    </form>
  );
}
