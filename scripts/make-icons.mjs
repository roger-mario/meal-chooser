// Regenerates the app icons in public/ from public/icon.svg: `node scripts/make-icons.mjs`
import { readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg", "utf8");
const BG = /<rect width="512" height="512" rx="112" fill="url\(#bg\)"\/>/;
if (!BG.test(svg)) throw new Error("public/icon.svg must start its art with the rounded background rect");

/** Square background (phones round the corners themselves) with the artwork scaled into the middle. */
function variant(scale, rounded) {
  const [head, rest] = svg.split(BG);
  const art = rest.replace("</svg>", "");
  const bg = `<rect width="512" height="512"${rounded ? ' rx="112"' : ""} fill="url(#bg)"/>`;
  return `${head}${bg}<g transform="translate(256 268) scale(${scale}) translate(-256 -256)">${art}</g></svg>`;
}

const icons = [
  { file: "icon-192.png", size: 192, svg: variant(1, true) },
  { file: "icon-512.png", size: 512, svg: variant(1, true) },
  // Android crops these to a circle or squircle, so the art stays inside the safe zone.
  { file: "icon-maskable-512.png", size: 512, svg: variant(0.76, false) },
  { file: "apple-touch-icon.png", size: 180, svg: variant(0.92, false) },
];

for (const { file, size, svg: source } of icons) {
  await sharp(Buffer.from(source), { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${file}`);
  console.log(`public/${file}`);
}
