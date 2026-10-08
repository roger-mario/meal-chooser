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
import { HealthSummary } from "@/components/HealthSummary";
import { isOutdated } from "@/lib/estimate-basis";
import { ShareButton } from "@/components/ShareButton";
import { bringLines, bringToken } from "@/lib/bring";
import { jobStatus } from "@/lib/ai-errors";
import { COST_STORE } from "@/lib/cost";
import { aiAvailable } from "@/lib/nutrients";
import { MealChat } from "@/components/MealChat";
import { getMeal, listComments } from "@/lib/queries";
import { currentHour, TIME_ZONE, todayISO } from "@/lib/dates";
import { labsEnabled } from "@/lib/labs-queries";
import { AteThisButton } from "@/components/labs/AteThisButton";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";
// AI estimates can take a while.
export const maxDuration = 300;

function OutdatedNote() {
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
      ⚠️ The ingredients or servings changed since this estimate, or it was made with an older, less accurate method.
      Open the details below and re-estimate for up-to-date values.
    </p>
  );
}

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const [meal, messages, me, labs] = await Promise.all([
    getMeal(Number(id)),
    listComments(Number(id)),
    getCurrentUser(),
    labsEnabled(),
  ]);
  if (!meal) notFound();
  const ai = aiAvailable();
  const costJob = jobStatus(meal.costJobStartedAt, meal.costJobError);
  const nutritionJob = jobStatus(meal.nutritionJobStartedAt, meal.nutritionJobError);
  const costButton = ai && (
    <EstimateButton
      action={estimateMealCost.bind(null, meal.id)}
      hasEstimate={!!meal.cost}
      label="Estimate prices with AI"
      job={costJob}
      workingText={`AI is checking ${COST_STORE} prices…`}
    />
  );
  const nutritionButton = ai && (
    <EstimateButton
      action={estimateMealNutrition.bind(null, meal.id)}
      hasEstimate={!!meal.nutrition}
      label="Estimate nutrition with AI"
      job={nutritionJob}
      workingText="AI is calculating nutrition…"
    />
  );

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
            {labs && me && <AteThisButton mealId={meal.id} day={todayISO()} hour={currentHour()} />}
          </>
        }
      />

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">💰 Cost at {COST_STORE}</h2>
        {isOutdated(meal.cost, meal) && <OutdatedNote />}
        {meal.cost && meal.cost.items.length > 0 ? (
          <CostPanel
            cost={meal.cost}
            servings={meal.servings}
            detailsOpen={costJob.running || !!costJob.error}
            details={
              <>
                {costButton}
                <CostForm mealId={meal.id} ingredients={meal.ingredients} cost={meal.cost} />
              </>
            }
          />
        ) : (
          <>
            <p className="text-sm text-stone-500">
              {ai
                ? `No prices yet. Let the AI estimate current ${COST_STORE} prices, or enter them yourself.`
                : `No prices yet. Enter what each ingredient costs at ${COST_STORE} below.`}
            </p>
            {costButton}
            <CostForm mealId={meal.id} ingredients={meal.ingredients} cost={meal.cost} />
          </>
        )}
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-lg font-semibold">🥗 Nutrition per serving</h2>
        {isOutdated(meal.nutrition, meal) && <OutdatedNote />}
        {meal.nutrition ? (
          <>
            <HealthSummary nutrition={meal.nutrition} />
            <NutritionPanel
              nutrition={meal.nutrition}
              detailsOpen={nutritionJob.running || !!nutritionJob.error}
              details={
                <>
                  {nutritionButton}
                  <NutritionForm mealId={meal.id} nutrition={meal.nutrition} />
                </>
              }
            />
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500">
              {ai
                ? "No values yet. Let the AI estimate calories, macros, vitamins and minerals, or enter them yourself."
                : "No values yet. Enter them below, for example from a package label or a nutrition app."}
            </p>
            {nutritionButton}
            <NutritionForm mealId={meal.id} nutrition={meal.nutrition} />
          </>
        )}
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
