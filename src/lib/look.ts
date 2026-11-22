/** Small helpers for the v7 look, shared by the website pages. */

/** Soft background tints for recipes without a photo, picked by id. */
export const TILES = ["#FFE3D3", "#E2F3E6", "#E6EEFB", "#FFF0C7", "#FBE4EC", "#F3E8DA"] as const;
export const tileFor = (id: number) => TILES[Math.abs(id) % TILES.length];
/** Tiles on the blue "Otao suggests" wave must stand out from it, so the blue tile swaps to a warm one. */
export const onSky = (tile: string) => (tile === "#E6EEFB" ? "#FFE3D3" : tile);

const AVATARS: [string, string][] = [
  ["#E4F0FB", "#1F5A8A"],
  ["#E2F3E6", "#1E6B45"],
  ["#FFF0C7", "#7A5A00"],
  ["#FFE3D3", "#A6402A"],
];
export const avatarColors = (id: number) => AVATARS[Math.abs(id) % AVATARS.length];
export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)).toUpperCase();
};

/** "≈ CHF 4.50", or null when there is no estimate. */
export const chf = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? null : `≈ CHF ${v.toFixed(2)}`);

// Short lines for the top of Home, so it isn't always the same.
const ANY = ["What’s cooking, {n}?", "Hungry, {n}?", "Ready to cook, {n}?", "What sounds good, {n}?", "Let’s eat well, {n}", "Something tasty, {n}?"];
const MORNING = ["Good morning, {n}", "Prep day, {n}?"];
const EVENING = ["Dinner ideas, {n}?", "What’s for dinner, {n}?"];

export function pickGreeting(name: string | null, hour: number, rand = Math.random()) {
  const pool = [...ANY, ...(hour >= 5 && hour < 11 ? MORNING : []), ...(hour >= 16 && hour < 21 ? EVENING : [])];
  const line = pool[Math.floor(rand * pool.length) % pool.length];
  return name ? line.replace("{n}", name) : line.replace(", {n}", "").replace(" {n}", "");
}
