// tools/take_shots.mjs
// Screenshot refresh pass for the GTA VI trophy guide repo.
//
// Tries, in order:
//   1. A real headless browser screenshot via puppeteer / playwright (if installed)
//      against app/index.html.
//   2. Fallback: renders a valid 1280x900 PNG placeholder per shot via pure node
//      (zlib-deflated raw pixel data) — a "Vice City neon gradient" in the repo's
//      neon palette, with a distinct tint per shot so the four files differ.
//
// Usage: node tools/take_shots.mjs [app/index.html] [screenshots/]
// Writes: screenshots/1-hero.png, 2-checklist-guide.png, 3-roadmap.png, 4-spoiler.png

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const htmlPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : resolve(repo, "app/index.html");
const outDir = process.argv[3] ? resolve(process.cwd(), process.argv[3]) : resolve(repo, "screenshots");

const SHOTS = [
  { file: "1-hero.png", tint: [255, 0, 128] },   // neon pink
  { file: "2-checklist-guide.png", tint: [0, 255, 231] }, // neon teal
  { file: "3-roadmap.png", tint: [155, 92, 255] }, // neon violet
  { file: "4-spoiler.png", tint: [255, 184, 0] }, // spoiler amber
];

const W = 1280, H = 900;

// ---------- PNG encoding (pure node) ----------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  // filter type 0 per scanline
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // signature
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- neon gradient renderer (fallback) ----------
function neonGradient(tint, seed) {
  const px = Buffer.alloc(W * H * 4);
  const [r0, g0, b0] = tint;
  // second hue, complementary-ish, for the gradient sweep
  const r1 = (tint[2] + 40) % 256, g1 = tint[0] % 256, b1 = (tint[1] + 120) % 256;
  for (let y = 0; y < H; y++) {
    const ty = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const tx = x / (W - 1);
      const i = (y * W + x) * 4;
      // diagonal neon sweep + subtle scanline texture keyed by seed
      const sweep = (tx * 0.6 + ty * 0.4);
      const glow = 0.5 + 0.5 * Math.sin((tx + ty) * Math.PI * 2 + seed);
      const scan = y % 3 === 0 ? 0.94 : 1;
      px[i]     = Math.min(255, (r0 * (1 - sweep) + r1 * sweep) * (0.55 + 0.45 * glow) * scan) | 0;
      px[i + 1] = Math.min(255, (g0 * (1 - sweep) + g1 * sweep) * (0.55 + 0.45 * glow) * scan) | 0;
      px[i + 2] = Math.min(255, (b0 * (1 - sweep) + b1 * sweep) * (0.55 + 0.45 * glow) * scan) | 0;
      px[i + 3] = 255;
    }
  }
  return px;
}

// ---------- real browser attempt ----------
async function tryBrowserShot() {
  const browserUrl = "file://" + htmlPath;
  try {
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H });
    await page.goto(browserUrl, { waitUntil: "networkidle0" });
    await page.screenshot({ path: resolve(outDir, SHOTS[0].file) });
    // For the other shots, scroll to different sections so they differ.
    for (let i = 1; i < SHOTS.length; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * 900);
      await new Promise((r) => setTimeout(r, 150));
      await page.screenshot({ path: resolve(outDir, SHOTS[i].file) });
    }
    await browser.close();
    return "puppeteer";
  } catch (e1) {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      await page.goto(browserUrl, { waitUntil: "networkidle" });
      await page.screenshot({ path: resolve(outDir, SHOTS[0].file) });
      for (let i = 1; i < SHOTS.length; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), i * 900);
        await page.waitForTimeout(150);
        await page.screenshot({ path: resolve(outDir, SHOTS[i].file) });
      }
      await browser.close();
      return "playwright";
    } catch (e2) {
      console.error("no browser lib available:", e1.message, "|", e2.message);
      return null;
    }
  }
}

// ---------- main ----------
mkdirSync(outDir, { recursive: true });

const via = await tryBrowserShot();
if (via) {
  console.log(`screenshots captured via ${via} from ${htmlPath}`);
} else {
  console.log("no headless browser available — writing neon-gradient PNG placeholders (pure node zlib)");
  for (const [i, shot] of SHOTS.entries()) {
    const png = encodePNG(W, H, neonGradient(shot.tint, i + 1));
    writeFileSync(resolve(outDir, shot.file), png);
    console.log(`wrote ${shot.file} (${png.length} bytes)`);
  }
}
console.log("done");
