import type { MealLink } from "./meal-fields";

/** Category every recipe rebuilt from a creator's post gets. */
export const RECREATED = "Recreated";

/** The Instagram creator a recipe was recreated from, read from its links (see recipe-import.ts). */
export function creatorOf(links: MealLink[] | null | undefined): { handle: string; url: string } | null {
  for (const l of links ?? []) {
    const m = l.url.match(/^https:\/\/(?:www\.)?instagram\.com\/([\w.]{1,30})\/?$/i);
    if (m && !["p", "reel", "reels", "tv"].includes(m[1].toLowerCase())) return { handle: m[1].toLowerCase(), url: l.url };
  }
  for (const l of links ?? []) {
    const m = l.label?.match(/by @([\w.]{1,30})/);
    if (m && /instagram\.com\//i.test(l.url)) return { handle: m[1].toLowerCase(), url: `https://www.instagram.com/${m[1]}/` };
  }
  return null;
}
