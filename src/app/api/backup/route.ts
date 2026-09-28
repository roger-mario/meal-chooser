import { buildBackup } from "@/lib/backup";
import { todayISO } from "@/lib/dates";

// Protected by the site password like every other page (see proxy.ts).
export async function GET() {
  const backup = await buildBackup();
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="meal-chooser-backup-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
