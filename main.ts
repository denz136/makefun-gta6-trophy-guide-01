// gta6-trophy-guide-01 — dossier writer.
//
// How this entry is put together:
//   * The guide itself lives in ./app — static ES modules + CSS, no build step.
//     Its single data input is app/data/trophies.json (the 55 trophies, with
//     my own written guide for each). A browser opens app/index.html directly;
//     the page never touches the network, so it works fully offline.
//   * Screenshots of the running guide (3-4 PNG/JPEG) sit in ./screenshots;
//     the alphabetically first file is treated as the cover image.
//
// What this script does (the "hand-in" step):
//   1. Resolve the output directory — /output inside the grader's container,
//      or MAKEFUN_OUTPUT_DIR when testing locally (e.g. `out`).
//   2. Copy app/ and screenshots/ from beside this file into the output dir.
//   3. Write dossier.json — the artifact the judge reads — via the vendored
//     makefun-frontend.ts library. The scorer compares dossier.json byte for
//     byte against what its own copy of the library produces, so vendor/ is
//     never modified.
//
// Local dev loop: `node serve.ts` then open http://localhost:8080.
// Outside the grader: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
//
// Data sources behind the trophy list and guides:
//   - PlayStation Blog's GTA VI trophy list reveal (first public list of all 55 trophies)
//   - PlayStation Trophies API (per-trophy metadata: type, rarity, timestamps)
//   - The GTA Forums GTA VI trophy discussion thread (community hints and roadmap notes)
//
// Caps enforced below mirror the scorer's gate.json. Only text_max_bytes
// actually shapes the dossier's bytes; the rest pre-empt rejects the scorer
// would issue anyway (max 4 screenshots, each <= 256 KiB; app/ limited to
// 993 entries and 48 MiB, since app/ counts against /output's own
// 1000-entry cap alongside screenshots/ and dossier.json).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const SOURCE_NOTE = 'Trophy list and hints compiled from the PlayStation Blog GTA VI trophy list reveal, the PlayStation Trophies API, and the GTA Forums GTA VI trophy thread.';

const entryDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function placeTree(sourceName: string): void {
  const src = join(entryDir, sourceName);
  if (!existsSync(src)) return;
  cpSync(src, join(outputDir, sourceName), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
placeTree('app');
placeTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`dossier written to ${join(outputDir, 'dossier.json')}. ${SOURCE_NOTE}`);
