import Link from "next/link";
import { chf } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import { DIETS, DIFFICULTIES, formatQuantity, linkIcon, linkLabel } from "@/lib/meal-fields";
import type { MealWithCategories } from "@/lib/queries";
import { AuthorLine } from "./AuthorLine";
import { CategoryChip } from "./CategoryChip";
import { Dish, ScoreChip, StepArt } from "./v7/Dish";
import { Fold } from "./v7/Fold";

/** Hero, facts, ingredients and steps; shared by the recipe page and the public share page. */
export function MealView({
  meal,
  actions,
  top,
  ingredientLinks = false,
}: {
  meal: MealWithCategories;
  actions?: React.ReactNode;
  /** Buttons over the photo (back, like). */
  top?: React.ReactNode;
  /** Link each ingredient's kind to the other recipes using it (not on the public share page). */
  ingredientLinks?: boolean;
}) {
  const mainIngredients = meal.ingredients.filter((i) => !i.staple);
  const basics = meal.ingredients.filter((i) => i.staple);
  const f = mealFacts(meal);
  const diet = DIETS.find((d) => d.value === meal.diet);
  const difficulty = DIFFICULTIES.find((d) => d.value === meal.difficulty);
  const facts = [
    { label: "Time", value: f.time ?? "–" },
    { label: "Calories", value: f.kcal ? `${f.kcal}` : "–" },
    { label: "Per portion", value: f.chf != null ? chf(f.chf)!.replace("≈ ", "") : "–" },
    { label: "Servings", value: String(meal.servings) },
  ];
  return (
    <>
      <div className="relative -mx-4 -mt-[calc(env(safe-area-inset-top)+14px)] md:mx-0 md:mt-0">
        <Dish meal={meal} className="aspect-[4/3] max-h-[62vh] w-full md:aspect-[16/9] md:rounded-[28px]" sizes="(min-width: 1024px) 768px, 100vw" preload />
        {top && <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)] md:p-4">{top}</div>}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ScoreChip score={f.score} className="border border-line" />
          {meal.categories.map((c) => (
            <CategoryChip key={c.id} category={c} showName />
          ))}
          {meal.babyFriendly && <span className="rounded-full bg-sky px-2.5 py-1 text-xs font-bold text-sky-ink">Baby-friendly</span>}
          {diet && <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-mint-ink">{diet.label}</span>}
          {difficulty && <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-bold text-ink2">{difficulty.label}</span>}
        </div>
        <h1 className="text-[28px] leading-tight font-extrabold tracking-tight md:text-4xl">{meal.name}</h1>
        {meal.description && <p className="leading-relaxed text-ink2">{meal.description}</p>}
        <AuthorLine author={meal.author} createdAt={meal.createdAt} updatedAt={meal.updatedAt} />
      </section>

      <dl className="grid grid-cols-4 divide-x divide-line rounded-[22px] bg-sand py-3">
        {facts.map((x) => (
          <div key={x.label} className="px-1 text-center">
            <dt className="text-[11px] font-bold tracking-[0.04em] text-muted uppercase">{x.label}</dt>
            <dd className="mt-0.5 truncate text-[15px] font-extrabold">{x.value}</dd>
          </div>
        ))}
      </dl>

      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}

      <Fold title="Ingredients" meta={meal.ingredients.length ? `${meal.ingredients.length}` : undefined} open>
        {meal.ingredients.length === 0 ? (
          <p className="text-sm text-muted">No ingredients yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {mainIngredients.map((item, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-center gap-3 py-3">
                    <input type="checkbox" className="peer h-5 w-5 shrink-0 accent-coral" />
                    <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 font-semibold peer-checked:text-off peer-checked:line-through">
                      {item.name}
                      {item.variant &&
                        (ingredientLinks ? (
                          <Link
                            href={`/search?${new URLSearchParams({ ingredient: item.name, variant: item.variant })}`}
                            title={`Other recipes with ${item.variant} ${item.name}`}
                            className="rounded-full bg-peach px-2 py-0.5 text-xs font-bold text-coral-ink hover:brightness-95"
                          >
                            {item.variant}
                          </Link>
                        ) : (
                          <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-bold text-ink2">{item.variant}</span>
                        ))}
                    </span>
                    <span className="text-sm text-muted tabular-nums">{formatQuantity(item)}</span>
                  </label>
                </li>
              ))}
            </ul>
            {basics.length > 0 && (
              <p className="text-sm text-muted">
                <span className="font-bold text-ink2">Basics:</span>{" "}
                {basics
                  .map((b) => {
                    const details = [b.variant, formatQuantity(b)].filter(Boolean).join(", ");
                    return details ? `${b.name} (${details})` : b.name;
                  })
                  .join(", ")}
              </p>
            )}
          </>
        )}
      </Fold>

      <Fold title="Steps" meta={meal.steps.length ? `${meal.steps.length}` : undefined}>
        {meal.steps.length === 0 ? (
          <p className="text-sm text-muted">No steps yet.</p>
        ) : (
          <ol className="space-y-4">
            {meal.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="pt-0.5 leading-relaxed">{s}</p>
                  <StepArt meal={meal} index={i} count={meal.steps.length} step={s} />
                </div>
              </li>
            ))}
          </ol>
        )}
        {meal.links.length > 0 && (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-bold text-ink2">Sources</h3>
            <ul className="space-y-1.5">
              {meal.links.map((l, i) => (
                <li key={i}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 text-sm font-semibold text-coral-ink hover:underline">
                    <span>{linkIcon(l.url)}</span>
                    {linkLabel(l)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Fold>
    </>
  );
}
