import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
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
import { currentHour, formatDay, TIME_ZONE, todayISO } from "@/lib/dates";
import { labsEnabled } from "@/lib/labs-queries";
import { AteThisButton } from "@/components/labs/AteThisButton";
import { getCurrentUser } from "@/lib/users";
import { canPublish, collectionInApp, isFavourite, recordView } from "@/lib/collection";
import { AddToPlan } from "@/components/v7/AddToPlan";
import { Fold } from "@/components/v7/Fold";
import { Icon } from "@/components/v7/Icons";
import { LikeButton } from "@/components/v7/LikeButton";
import { mealHealth } from "@/lib/health";
import { addDays } from "@/lib/labs";
import { chf } from "@/lib/look";
import { mealFacts } from "@/lib/meal-facts";
import { PublicToggle } from "@/components/collection/PublicToggle";

export const dynamic = "force-dynamic";
// AI estimates can take a while.
export const maxDuration = 300;

function OutdatedNote() {
  return (
    <p className="rounded-2xl bg-butter px-3.5 py-2.5 text-sm text-butter-ink">
      The ingredients or servings changed since this estimate, or it was made with an older, less accurate method.
      Open the details below and re-estimate for up-to-date values.
    </p>
  );
}

export default async function MealPage({ params }: PageProps<"/meals/[id]">) {
  const { id } = await params;
  const [meal, messages, me, labs, collection] = await Promise.all([
    getMeal(Number(id)),
    listComments(Number(id)),
    getCurrentUser(),
    labsEnabled(),
    collectionInApp(),
  ]);
  if (!meal) notFound();
  // Quick picks learn from what each person opens, also before they turn Labs on.
  if (me) after(() => recordView(me.id, meal.id).catch(() => {}));
  const favourite = me ? await isFavourite(me.id, meal.id) : false;
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

  const today = todayISO();
  const planDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    return { day, label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDay(day, { day: undefined, month: undefined }) };
  });
  const perPortion = mealFacts(meal).chf;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <MealView
        ingredientLinks
        meal={meal}
        top={
          <>
            <Link href="/" aria-label="Back to Home" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-sm">
              <Icon.back className="h-5 w-5" />
            </Link>
            <span className="flex-1" />
            {me && <LikeButton mealId={meal.id} on={favourite} />}
          </>
        }
        actions={
          <>
            <AddToPlan mealId={meal.id} days={planDays} />
            <Link href={`/meals/${meal.id}/edit`} className="btn">
              <Icon.edit className="h-4 w-4" /> Edit
            </Link>
            <ShareButton mealId={meal.id} token={meal.shareToken} />
            {bringLines(meal.ingredients).length > 0 && <BringButton token={bringToken(meal.id)} servings={meal.servings} />}
            {collection && canPublish(meal, me?.id) && <PublicToggle mealId={meal.id} isPublic={meal.isPublic} />}
            {labs && me && <AteThisButton mealId={meal.id} day={today} hour={currentHour()} />}
          </>
        }
      />

      {meal.nutrition && (
        <Fold title="Otao score" meta={mealHealth(meal.nutrition)?.score} open>
          <HealthSummary nutrition={meal.nutrition} />
        </Fold>
      )}

      <Fold title="Nutrition per serving" meta={meal.nutrition ? `${Math.round(meal.nutrition.perServing.calories ?? 0)} kcal` : "Not yet"} open={nutritionJob.running || !!nutritionJob.error}>
        {isOutdated(meal.nutrition, meal) && <OutdatedNote />}
        {meal.nutrition ? (
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
        ) : (
          <>
            <p className="text-sm text-muted">
              {ai
                ? "No values yet. Let the AI estimate calories, macros, vitamins and minerals, or enter them yourself."
                : "No values yet. Enter them below, for example from a package label or a nutrition app."}
            </p>
            {nutritionButton}
            <NutritionForm mealId={meal.id} nutrition={meal.nutrition} />
          </>
        )}
      </Fold>

      <Fold title={`Cost at ${COST_STORE}`} meta={chf(perPortion) ?? "Not yet"} open={costJob.running || !!costJob.error}>
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
            <p className="text-sm text-muted">
              {ai
                ? `No prices yet. Let the AI estimate current ${COST_STORE} prices, or enter them yourself.`
                : `No prices yet. Enter what each ingredient costs at ${COST_STORE} below.`}
            </p>
            {costButton}
            <CostForm mealId={meal.id} ingredients={meal.ingredients} cost={meal.cost} />
          </>
        )}
      </Fold>

      <Fold id="chat" title="Comments" meta={messages.length || undefined}>
        <MealChat mealId={meal.id} messages={messages} meId={me?.id ?? null} timeZone={TIME_ZONE} />
      </Fold>

      <div className="flex justify-center pt-2">
        <DeleteMealButton mealId={meal.id} name={meal.name} />
      </div>
    </div>
  );
}
