import Link from "next/link";
import { notFound } from "next/navigation";
import { estimateMealCost, estimateMealNutrition } from "@/app/actions/meals";
import { BringButton } from "@/components/BringButton";
import { CostForm } from "@/components/CostForm";
import { CostPanel } from "@/components/CostPanel";
import { DeleteMealButton } from "@/components/DeleteMealButton";
import { EstimateButton } from "@/components/EstimateButton";
import { MealView } from "@/components/MealView";
import { NutritionForm } from "@/components/NutritionForm";
import { NutritionPanel } from "@/components/NutritionPanel";
import { ShareButton } from "@/components/ShareButton";
import { bringLines, bringToken } from "@/lib/bring";
import { jobStatus } from "@/lib/ai-errors";
import { COST_STORE } from "@/lib/cost";
import { aiAvailable } from "@/lib/nutrients";
import { MealChat } from "@/components/MealChat";
import { getMeal, listComments } from "@/lib/queries";
import { TIME_ZONE } from "@/lib/dates";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";
// AI estimates can take a while.
export const maxDuration = 120;

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const [meal, messages, me] = await Promise.all([getMeal(Number(id)), listComments(Number(id)), getCurrentUser()]);
  if (!meal) notFound();
  const ai = aiAvailable();

  return (
    <div className="space-y-4 sm:space-y-6">
      <MealView
        ingredientLinks
        meal={meal}
        actions={
          <>
            <Link href={`/meals/${meal.id}/edit`} className="btn">
              ✏️ Edit
            </Link>
            <ShareButton mealId={meal.id} token={meal.shareToken} />
            {bringLines(meal.ingredients).length > 0 && (
              <BringButton token={bringToken(meal.id)} servings={meal.servings} />
            )}
          </>
        }
      />

      <section className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">💰 Cost at {COST_STORE}</h2>
          {ai && (
            <EstimateButton
              action={estimateMealCost.bind(null, meal.id)}
              hasEstimate={!!meal.cost}
              label="Estimate prices with AI"
              job={jobStatus(meal.costJobStartedAt, meal.costJobError)}
              workingText={`AI is checking ${COST_STORE} prices…`}
            />
          )}
        </div>
        {meal.cost && meal.cost.items.length > 0 ? (
          <CostPanel cost={meal.cost} servings={meal.servings} />
        ) : (
          <p className="text-sm text-stone-500">
            {ai
              ? `No prices yet. Let the AI estimate current ${COST_STORE} prices, or enter them yourself.`
              : `No prices yet. Enter what each ingredient costs at ${COST_STORE} below.`}
          </p>
        )}
        <CostForm mealId={meal.id} ingredients={meal.ingredients} cost={meal.cost} />
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">🥗 Nutrition per serving</h2>
          {ai && (
            <EstimateButton
              action={estimateMealNutrition.bind(null, meal.id)}
              hasEstimate={!!meal.nutrition}
              label="Estimate nutrition with AI"
              job={jobStatus(meal.nutritionJobStartedAt, meal.nutritionJobError)}
              workingText="AI is calculating nutrition…"
            />
          )}
        </div>
        {meal.nutrition ? (
          <NutritionPanel nutrition={meal.nutrition} />
        ) : (
          <p className="text-sm text-stone-500">
            {ai
              ? "No values yet. Let the AI estimate calories, macros, vitamins and minerals, or enter them yourself."
              : "No values yet. Enter them below, for example from a package label or a nutrition app."}
          </p>
        )}
        <NutritionForm mealId={meal.id} nutrition={meal.nutrition} />
      </section>

      <section id="chat" className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">
          💬 Chat{messages.length > 0 && <span className="ml-1.5 text-sm font-normal text-stone-400">{messages.length}</span>}
        </h2>
        <MealChat
          mealId={meal.id}
          messages={messages}
          meId={me?.id ?? null}
          timeZone={TIME_ZONE}
        />
      </section>

      <div className="flex justify-center pt-2">
        <DeleteMealButton mealId={meal.id} name={meal.name} />
      </div>
    </div>
  );
}
