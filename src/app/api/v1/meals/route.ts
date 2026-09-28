import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkApiKey } from "@/lib/api-auth";
import { createMealFromInput } from "@/lib/meal-store";
import { mealInputSchema } from "@/lib/meal-input";
import { listMeals } from "@/lib/queries";

export async function GET(request: Request) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const meals = await listMeals();
  const origin = new URL(request.url).origin;
  return Response.json({
    meals: meals.map((m) => ({
      id: m.id,
      name: m.name,
      categories: m.categories.map((c) => c.name),
      url: `${origin}/meals/${m.id}`,
    })),
  });
}

/** Body: one meal object, or `{ "meals": [ … ] }` to add several at once. */
export async function POST(request: Request) {
  const denied = checkApiKey(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const many = z.object({ meals: z.array(mealInputSchema).min(1).max(100) }).safeParse(body);
  const one = many.success ? null : mealInputSchema.safeParse(body);
  if (!many.success && !one?.success) {
    return Response.json(
      { error: "Invalid meal.", issues: (one?.error ?? many.error).issues.slice(0, 20) },
      { status: 400 },
    );
  }

  const inputs = many.success ? many.data.meals : [one!.data!];
  const origin = new URL(request.url).origin;
  const created = [];
  for (const input of inputs) {
    const id = await createMealFromInput(input);
    created.push({ id, name: input.name, url: `${origin}/meals/${id}` });
  }
  revalidatePath("/", "layout");
  return Response.json({ created }, { status: 201 });
}
