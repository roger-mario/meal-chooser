import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { listMeals } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** "Surprise me": opens a random meal, within the chosen category if there is one. */
export async function GET(request: NextRequest) {
  const category = Number(request.nextUrl.searchParams.get("category")) || undefined;
  const meals = await listMeals({ categoryId: category });
  if (meals.length === 0) redirect("/");
  redirect(`/meals/${meals[Math.floor(Math.random() * meals.length)].id}`);
}
