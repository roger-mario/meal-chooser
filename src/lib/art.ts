/* Soft, flat food illustrations for recipes without a photo (same style as the v3 design). */

export type Kind = "bowl" | "tray" | "slice" | "patties" | "pot" | "crackers" | "board" | "pan";
export type Food = { kind: Kind; base: string; items: string[] };

const COLORS = ["#F28C3B", "#4E9A50", "#A8CC6E", "#8A4B32", "#D9452F", "#E9C46A", "#3B2E35", "#FFFDF5", "#E8473B", "#6DB35A", "#F7DC5B"];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Picks an illustration that roughly fits the dish name. */
export function foodFor(name: string, id: number): Food {
  const n = name.toLowerCase();
  const h = hash(name + id);
  const pick = (k: number) => Array.from({ length: k }, (_, i) => COLORS[(h + i * 3) % COLORS.length]);
  if (/salmon|lachs|fish|fisch|trout|forelle|cod|traybake|tray|blech/.test(n)) return { kind: "tray", base: "#F5916B", items: ["#E9C46A", "#5DA348", "#F7DC5B"] };
  if (/lasagn|gratin|quiche|pie|moussaka|auflauf/.test(n)) return { kind: "slice", base: "#E46B4A", items: ["#F6E7C1", "#F2C14E", "#5DA348"] };
  if (/patt|burger|fritter|falafel|meatball|frikadell|bällchen|pancake|pfannkuchen/.test(n)) return { kind: "patties", base: "#D9A35C", items: ["#7FB069", "#F7DC5B", "#FFFFFF"] };
  if (/cracker|cookie|biscuit|bar\b|riegel|muffin|guetzli|keks/.test(n)) return { kind: "crackers", base: "#F2A65A", items: ["#E07B39", "#D9A35C"] };
  if (/stew|casserole|curry|soup|suppe|chili|eintopf|dal|ragout|goulash|gulasch/.test(n)) return { kind: "pot", base: /curry|dal/.test(n) ? "#E0A43A" : "#C8553D", items: ["#F4ECDC", "#D99A5B", "#5DA348"] };
  const base = /rice|reis|korean|asia|bowl|poke|risotto/.test(n) ? "#FBF7EE" : /pasta|penne|spaghetti|tomat|bolognese|pizza/.test(n) ? "#C8553D" : /oat|porridge|müsli|muesli|granola/.test(n) ? "#F1E6CF" : "#F1E6CF";
  return { kind: "bowl", base, items: pick(4) };
}

function seeded(str: string) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647; return function () { h = (h * 16807) % 2147483647; return (h - 1) / 2147483646; }; }
function leaves(r: () => number, n: number, color: string) { let o = ''; for (let i = 0; i < n; i++) { const x = r() < 0.5 ? 14 + r() * 26 : 160 + r() * 26, y = 18 + r() * 114; o += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="7" ry="3.4" fill="' + color + '" transform="rotate(' + Math.round(r() * 180) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'; } return o; }
function blobs(r: () => number, cx: number, cy: number, rad: number, color: string, n: number, min: number, max: number) { let o = ''; for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad, s = min + r() * (max - min); o += '<rect x="' + (cx + Math.cos(a) * d - s / 2).toFixed(1) + '" y="' + (cy + Math.sin(a) * d - s / 2).toFixed(1) + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" rx="' + (s / 2.6).toFixed(1) + '" fill="' + color + '" transform="rotate(' + Math.round(r() * 90) + ' ' + (cx + Math.cos(a) * d).toFixed(1) + ' ' + (cy + Math.sin(a) * d).toFixed(1) + ')"/>'; } return o; }
function plate(cx: number, cy: number, rad: number) { return '<circle cx="' + (cx + 2) + '" cy="' + (cy + 4) + '" r="' + rad + '" fill="rgba(60,40,20,0.10)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '" fill="#FFFFFF"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (rad - 7) + '" fill="#F7F3EE"/>'; }
export function dishSvg(f: Food, seed: string, kind?: Kind): string {
  const r = seeded(seed + (kind || '')), k = kind || f.kind;
  let o = '', i;
  if (k === 'board') {
    o += '<rect x="34" y="26" width="132" height="98" rx="16" fill="rgba(60,40,20,0.10)" transform="translate(2 4)"/><rect x="34" y="26" width="132" height="98" rx="16" fill="#E8C9A0"/><circle cx="152" cy="38" r="4" fill="#D4B184"/>';
    const cols = [f.base].concat(f.items);
    for (i = 0; i < cols.length; i++) { o += blobs(r, 62 + (i % 3) * 38, 56 + Math.floor(i / 3) * 40, 12, cols[i], 7, 6, 10); }
    o += '<rect x="120" y="100" width="58" height="7" rx="3.5" fill="#9AA3AE" transform="rotate(-18 150 104)"/><rect x="164" y="88" width="24" height="9" rx="4" fill="#3D4552" transform="rotate(-18 176 92)"/>';
  } else if (k === 'pan') {
    o += '<rect x="138" y="70" width="58" height="12" rx="6" fill="#2F3540" transform="rotate(-12 140 76)"/><circle cx="92" cy="77" r="56" fill="rgba(60,40,20,0.12)"/><circle cx="90" cy="74" r="56" fill="#3D4552"/><circle cx="90" cy="74" r="48" fill="#4B5463"/>';
    o += blobs(r, 90, 74, 34, f.base, 14, 8, 14);
    for (i = 0; i < f.items.length; i++) o += blobs(r, 90, 74, 36, f.items[i], 6, 5, 9);
    o += '<path d="M70 22c-4-6 4-8 0-14M90 18c-4-6 4-8 0-14M110 22c-4-6 4-8 0-14" stroke="rgba(255,255,255,0.8)" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  } else if (k === 'tray') {
    o += '<rect x="26" y="24" width="148" height="104" rx="14" fill="rgba(60,40,20,0.12)" transform="translate(2 4)"/><rect x="26" y="24" width="148" height="104" rx="14" fill="#D9D3CA"/><rect x="33" y="31" width="134" height="90" rx="9" fill="#F4EFE7"/>';
    for (i = 0; i < 9; i++) { const px = 46 + r() * 108, py = 42 + r() * 68; o += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (7 + r() * 3).toFixed(1) + '" fill="' + f.items[0] + '"/><circle cx="' + (px - 2).toFixed(1) + '" cy="' + (py - 2).toFixed(1) + '" r="2.5" fill="#F6DFA0"/>'; }
    for (i = 0; i < 10; i++) { const bx = 44 + r() * 112, by = 40 + r() * 72; o += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="26" height="4.5" rx="2.2" fill="' + f.items[1] + '" transform="rotate(' + Math.round(r() * 160) + ' ' + bx.toFixed(1) + ' ' + by.toFixed(1) + ')"/>'; }
    const fil = [[62, 58], [118, 52], [84, 92], [136, 92]];
    for (i = 0; i < 4; i++) { const fx = fil[i][0], fy = fil[i][1]; o += '<rect x="' + (fx - 20) + '" y="' + (fy - 12) + '" width="40" height="24" rx="9" fill="' + f.base + '" transform="rotate(' + (i % 2 ? 8 : -6) + ' ' + fx + ' ' + fy + ')"/><path d="M' + (fx - 10) + ' ' + (fy - 9) + 'q4 9 0 18M' + fx + ' ' + (fy - 10) + 'q4 10 0 20M' + (fx + 10) + ' ' + (fy - 9) + 'q4 9 0 18" stroke="#FFD2BF" stroke-width="2" fill="none"/>'; }
    o += '<circle cx="104" cy="70" r="10" fill="' + f.items[2] + '"/><circle cx="104" cy="70" r="7" fill="#FFF3B0"/><path d="M104 63v14M97 70h14M99 65l10 10M109 65l-10 10" stroke="' + f.items[2] + '" stroke-width="1.2"/>';
  } else if (k === 'slice') {
    o += plate(100, 75, 60) + '<g transform="rotate(-8 100 75)"><rect x="66" y="50" width="70" height="52" rx="6" fill="' + f.items[0] + '"/>';
    for (i = 0; i < 4; i++) o += '<rect x="66" y="' + (56 + i * 12) + '" width="70" height="6" fill="' + f.base + '"/>';
    o += '<path d="M66 54c10-8 18 4 28-2s18 4 28-2 14 2 14 2v-2a6 6 0 0 0-6-6H72a6 6 0 0 0-6 6z" fill="' + f.items[1] + '"/></g>' + blobs(r, 100, 52, 22, '#E8473B', 4, 3, 5);
    o += '<ellipse cx="128" cy="48" rx="8" ry="4" fill="' + f.items[2] + '" transform="rotate(-30 128 48)"/><ellipse cx="136" cy="54" rx="8" ry="4" fill="#4E8F3E" transform="rotate(20 136 54)"/>';
  } else if (k === 'patties') {
    o += plate(100, 75, 60);
    const pp = [[78, 58], [110, 52], [128, 80], [96, 92], [72, 86]];
    for (i = 0; i < pp.length; i++) { o += '<circle cx="' + pp[i][0] + '" cy="' + pp[i][1] + '" r="15" fill="#B9813F"/><circle cx="' + pp[i][0] + '" cy="' + (pp[i][1] - 1) + '" r="13" fill="' + f.base + '"/>' + blobs(r, pp[i][0], pp[i][1], 9, f.items[0], 4, 2, 3.5); }
    o += '<circle cx="150" cy="40" r="15" fill="rgba(60,40,20,0.10)"/><circle cx="148" cy="37" r="15" fill="#FFFFFF"/><circle cx="148" cy="37" r="11" fill="#FBF7EE"/>' + blobs(r, 148, 37, 6, f.items[0], 4, 2, 3);
    o += '<path d="M104 72l14 -6a14 14 0 0 1 -6 18z" fill="' + f.items[1] + '"/>';
  } else if (k === 'pot') {
    o += '<rect x="20" y="66" width="22" height="12" rx="6" fill="#2E4A6B"/><rect x="158" y="66" width="22" height="12" rx="6" fill="#2E4A6B"/><circle cx="102" cy="78" r="60" fill="rgba(60,40,20,0.12)"/><circle cx="100" cy="74" r="60" fill="#3D6A9E"/><circle cx="100" cy="74" r="51" fill="' + f.base + '"/>';
    o += blobs(r, 100, 74, 36, f.items[1], 7, 14, 20) + blobs(r, 100, 74, 40, f.items[0], 22, 5, 7) + blobs(r, 100, 74, 40, f.items[2], 10, 2.5, 4);
  } else if (k === 'crackers') {
    o += '<rect x="22" y="22" width="156" height="108" rx="18" fill="rgba(60,40,20,0.10)" transform="translate(2 4)"/><rect x="22" y="22" width="156" height="108" rx="18" fill="#E8C9A0"/>';
    for (i = 0; i < 12; i++) { const cx2 = 46 + (i % 4) * 36 + (r() - 0.5) * 6, cy2 = 46 + Math.floor(i / 4) * 30 + (r() - 0.5) * 6; o += '<rect x="' + (cx2 - 13).toFixed(1) + '" y="' + (cy2 - 11).toFixed(1) + '" width="26" height="22" rx="5" fill="' + (i % 3 ? f.base : f.items[0]) + '" transform="rotate(' + Math.round((r() - 0.5) * 24) + ' ' + cx2.toFixed(1) + ' ' + cy2.toFixed(1) + ')"/><circle cx="' + (cx2 - 5).toFixed(1) + '" cy="' + cy2.toFixed(1) + '" r="1.3" fill="#B85E25"/><circle cx="' + (cx2 + 5).toFixed(1) + '" cy="' + cy2.toFixed(1) + '" r="1.3" fill="#B85E25"/>'; }
  } else {
    o += plate(100, 75, 62) + '<circle cx="100" cy="75" r="47" fill="' + f.base + '"/>';
    const n = f.items.length, step = 6.283 / n;
    for (i = 0; i < n; i++) { const a = -1.57 + step * (i + 0.5); o += blobs(r, 100 + Math.cos(a) * 26, 75 + Math.sin(a) * 26, 15, f.items[i], 9, 6, 11); }
    o += blobs(r, 100, 75, 6, '#FFFFFF', 3, 2, 3);
  }
  if (k !== 'board' && k !== 'pan') o = leaves(r, 3, '#7FB069') + o;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice">' + o + '</svg>';
}

/** Illustration for one cooking step: what the step does (chop → board, fry → pan …); the last step shows the dish. */
export function stepKind(step: string, index: number, count: number, dish: Food): Kind {
  if (index === count - 1) return dish.kind;
  const s = step.toLowerCase();
  if (/\b(bake|oven|roast|air ?fr|broil|preheat)/.test(s)) return "tray";
  if (/\b(boil|simmer|rice|pasta|noodle|quinoa|potatoes?\b.*water|stock|broth)/.test(s)) return "pot";
  if (/\b(fry|sear|brown|saut|grill|pan|skillet|heat the oil|cook the (beef|chicken|meat|turkey|mince))/.test(s)) return "pan";
  if (/\b(chop|dice|slice|mince|cut|grate|shred|peel|trim|crush)/.test(s)) return "board";
  if (/\b(mix|combine|whisk|stir together|toss|marinate|season|assemble|divide|layer|top with|serve)/.test(s)) return "bowl";
  return index === 0 ? "board" : "pan";
}
