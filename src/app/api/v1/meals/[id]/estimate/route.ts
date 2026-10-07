import { revalidatePath } from "next/cache";
import { checkApiKey } from "@/lib/api-auth";
import { startCostJob, startNutritionJob } from "@/lib/estimate-jobs";

// The estimates run in the background after the response.
export const maxDuration = 120;

/** Starts new AI estimates for a meal. `?only=nutrition` or `?only=cost` runs just one of them. */
export async function POST(request: Request, ctx: RouteContext<"/api/v1/meals/[id]/estimate">) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const id = Number((await ctx.params).id);
  const only = new URL(request.url).searchParams.get("only");
  const errors: string[] = [];
  if (only !== "cost") {
    const e = await startNutritionJob(id);
    if (e) errors.push(e);
  }
  if (only !== "nutrition") {
    const e = await startCostJob(id);
    if (e) errors.push(e);
  }
  revalidatePath(`/meals/${id}`);
  if (errors.length) return Response.json({ error: errors.join(" ") }, { status: 400 });
  return Response.json({ started: true }, { status: 202 });
}
