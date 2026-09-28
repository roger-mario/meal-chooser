import { checkApiKey } from "@/lib/api-auth";
import { listCategories } from "@/lib/queries";

export async function GET(request: Request) {
  const denied = checkApiKey(request);
  if (denied) return denied;
  const categories = await listCategories();
  return Response.json({ categories: categories.map((c) => ({ name: c.name, emoji: c.emoji })) });
}
