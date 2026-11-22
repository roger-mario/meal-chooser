// Short lines for the top of Home. One is picked each time the app opens, so it isn't always the same.
const ANY = ["What’s cooking, {n}?", "Hungry, {n}?", "Ready to cook, {n}?", "What sounds good, {n}?", "Let’s eat well, {n}", "Something tasty, {n}?"];
const MORNING = ["Good morning, {n}", "Prep day, {n}?"];
const EVENING = ["Dinner ideas, {n}?", "What’s for dinner, {n}?"];

export function pickGreeting(name: string, now = new Date(), rand = Math.random()) {
  const h = now.getHours();
  const pool = [...ANY, ...(h >= 5 && h < 11 ? MORNING : []), ...(h >= 16 && h < 21 ? EVENING : [])];
  return pool[Math.floor(rand * pool.length) % pool.length].replace("{n}", name);
}
