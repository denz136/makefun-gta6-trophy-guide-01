# GTA VI Trophy Guide & Tracker
[![competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/denz136/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/denz136/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

# GTA VI Trophy Guide & Tracker

A single-page web app that doubles as a trophy guide and a personal completion
tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. It ships as a
handful of static files under `app/` — no build step, no framework, no
dependencies, and no network requests at runtime. Everything (guide text,
tracking state, filtering) runs entirely in the browser.

## What the app is

Open the page and you get a full checklist of the game's trophy list: one
platinum, two gold, six silver and forty-six bronze. Each trophy carries its
official name and description plus an original, plain-English guide on how to
earn it. The app is aimed at someone playing through the game who wants a
roadmap, wants to know which trophies can be missed and never recovered, and
wants to tick things off as they go.

The data is served from `app/assets/data.js` (a dataset embedded on
`window.GTA6_TROPHY_DATA` so the page also works when opened directly from
`file://`), with the canonical copy living at `app/data/trophies.json`.

## Features

- **Checklist** of all 55 trophies with grades, categories and descriptions.
- **Tracker** — mark trophies earned; progress persists in `localStorage`
  under the key `gta6-trophy-tracker-v1` and drives the hero stats, platinum
  progress bar and per-category chips.
- **Export / Import** — dump your progress to `gta6-trophy-progress.json`
  and reload it on another machine; the importer accepts both id-based and
  name-based exports.
- **Filters** — by grade (platinum/gold/silver/bronze), by kind (story,
  side, collectibles, stunts, online), plus a "Missable only" toggle.
- **Spoiler mode** — hides names, descriptions and guides of story trophies
  until they are marked earned.
- **Search** — live filtering across name, description, guide and chapter.
- **Platinum roadmap** — five phases (story, activities, crime side jobs,
  collectibles, counter grind) with ordering advice and a missables warning.
- **Missables tab** — every trophy flagged missable in the dataset.
- **Detail panel** — official description, original guide, cited sources and
  a mark-earned button per trophy.
- **Data Source tab** — what the dataset contains and where it came from.

## Offline usage

The app is fully offline by design: it fetches nothing, imports no libraries,
and loads no external fonts or images. Three ways to run it:

1. Easiest — open `app/index.html` directly in a browser (`file://` works,
   because the dataset is embedded in `data.js` rather than fetched).
2. Serve the folder: `cd app && python3 -m http.server 8000`, then open
   http://localhost:8000.
3. If you have Node, the kit's `node serve.ts` does the same job.

Your tracked progress lives in `localStorage`, so it survives reloads and
reboots on the same browser; use Export if you want to move it elsewhere.
The only time the app touches the network is when *you* click a citation
link in a trophy guide — links are plain anchors, nothing is fetched
automatically.

## Data sources

The trophy list itself (names, descriptions, grades) comes from the official
PlayStation list for GTA VI, dated 2026-11-18, as cross-listed by:

- [PSNProfiles](https://psnprofiles.com) — community trophy listings and
  rarity data.
- [Exophase](https://exophase.com) — trophy tracking and listings.

The two listings agree on every name, description and grade. Note that the
game had not shipped when this dataset was compiled, so the list should be
treated as pre-release and unconfirmed until it can be checked against a
live PSN source.

Everything beyond that list — categories (story / side / collection /
stunt), chapter tags, roadmap phases, missable flags and every guide text —
is original work written for this project, inferred from the official
descriptions and the structure of earlier GTA trophy lists. Where a guide
mentions a source by name, that is a citation of where the reasoning drew
from, not copied text.

One caveat: Sony hides 28 of the 55 trophies on PlayStation until earned;
the source data carries no per-trophy hidden flags, so `hidden` is `false`
on every item in this copy.

## Verification

All checks are offline and take seconds:

```sh
# JSON data is valid
python3 -m json.tool app/data/trophies.json > /dev/null && echo JSON-OK

# App script parses
node --check app/assets/app.js && echo JS-OK

# Dataset carries one Source citation per cited guide line (expect 55)
grep -c "Source:" app/data/trophies.json
```

The dataset holds exactly 55 trophies (1 platinum / 2 gold / 6 silver /
46 bronze — grade counts match the official list).

## Files

```
app/index.html          page structure and tabs
app/assets/style.css    original neon styling (no Rockstar assets, no external fonts)
app/assets/app.js       app logic — vanilla JS, no imports, no network
app/assets/data.js      dataset embedded on window.GTA6_TROPHY_DATA (file://-safe)
app/assets/data.json    the same dataset as plain JSON
app/data/trophies.json  canonical dataset (55 trophies)
tools/build_data.py     script that built the enriched dataset from the official list
```

## License

MIT — see `LICENSE` at the repository root. Fan-made project, not
affiliated with Rockstar Games or Sony Interactive Entertainment.
