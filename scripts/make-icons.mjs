// Regenerates the app icons in public/ and mobile/assets/ from public/icon.svg: `node scripts/make-icons.mjs`
import { readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg", "utf8");
const BG = /<rect width="512" height="512" rx="112" fill="url\(#bg\)"\/>/;
if (!BG.test(svg)) throw new Error("public/icon.svg must start its art with the rounded background rect");
const [head, rest] = svg.split(BG);
const art = rest.replace("</svg>", "");
// The bowl on its own, without food, leaf or steam: the splash screen shows it and the app's loader drops the food in.
const emptyBowl = art.slice(art.indexOf('<path fill="url(#bowl)"'));

/** Square or rounded background (phones round the corners themselves) with the artwork scaled into the middle. */
function variant(scale, { rounded = false, background = true, content = art } = {}) {
  const bg = background ? `<rect width="512" height="512"${rounded ? ' rx="112"' : ""} fill="url(#bg)"/>` : "";
  return `${head}${bg}<g transform="translate(256 268) scale(${scale}) translate(-256 -256)">${content}</g></svg>`;
}
const whiteArt = art.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="[^"]*"/g, 'stroke="#fff"').replace(/opacity="[^"]*"/g, "");

const icons = [
  { file: "public/icon-192.png", size: 192, svg: variant(1, { rounded: true }) },
  { file: "public/icon-512.png", size: 512, svg: variant(1, { rounded: true }) },
  // Android crops these to a circle or squircle, so the art stays inside the safe zone.
  { file: "public/icon-maskable-512.png", size: 512, svg: variant(0.76) },
  { file: "public/apple-touch-icon.png", size: 180, svg: variant(0.92) },
  // The phone app (Expo): iOS rounds the corners itself.
  { file: "mobile/assets/icon.png", size: 1024, svg: variant(0.92), flatten: true },
  { file: "mobile/assets/favicon.png", size: 48, svg: variant(1, { rounded: true }) },
  { file: "mobile/assets/splash-icon.png", size: 1024, svg: `${head}<rect width="512" height="512" rx="112" fill="url(#bg)"/>${emptyBowl}</svg>` },
  { file: "mobile/assets/android-icon-background.png", size: 1024, svg: `${head}<rect width="512" height="512" fill="url(#bg)"/></svg>`, flatten: true },
  { file: "mobile/assets/android-icon-foreground.png", size: 1024, svg: variant(0.62, { background: false }) },
  { file: "mobile/assets/android-icon-monochrome.png", size: 1024, svg: variant(0.62, { background: false, content: whiteArt }) },
];

for (const { file, size, svg: source, flatten } of icons) {
  let img = sharp(Buffer.from(source), { density: 600 }).resize(size, size);
  if (flatten) img = img.flatten({ background: "#064e3b" });
  await img.png({ compressionLevel: 9 }).toFile(file);
  console.log(file);
}
