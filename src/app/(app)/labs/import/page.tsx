import { InstagramImport } from "@/components/labs/InstagramImport";
import { creatorListingAvailable } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import from Instagram" };
// Each link is one call: Instagram, the AI and the photo download.
export const maxDuration = 120;

export default function ImportPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-sm text-stone-600 sm:text-base">
        Turn recipe reels into Otao recipes: ingredients with amounts, clear steps, and a link back to the creator. Imported
        recipes stay private. Run the nutrition estimate on the recipe page when you&apos;re happy with it.
      </p>
      <InstagramImport canList={creatorListingAvailable()} />
    </div>
  );
}
