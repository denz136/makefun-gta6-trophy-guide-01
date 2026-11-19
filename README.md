# GTA VI Trophy Guide & Tracker — Vice City Neon Edition

A fully offline, single-page guide and tracker for all **55 PlayStation 5 trophies** of
Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze). Plain static files under
`app/` — no build step, no framework, **zero network requests at runtime**. Serve `app/`
with any static HTTP server (`python3 -m http.server` inside `app/`, or the kit's
`node serve.ts`) and open `app/index.html`; it also works directly from `file://`.

## Features

- **Checklist of all 55 trophies** with official names, descriptions and grades.
- **Tracker**: tick trophies earned; progress is saved in `localStorage`
  (key `gta6-trophy-tracker-v1`) and shown in the hero stats, platinum progress bar
  and per-category chips (story / side / collection / stunt).
- **Export / Import**: export progress to `gta6-trophy-progress.json` and re-import it
  on any machine (accepts both id-based and name-based exports).
- **Filters**: by grade (platinum/gold/silver/bronze), by kind (story, side,
  collectibles, stunts, online), plus a "Missable only" toggle.
- **Spoiler mode**: hides the names, descriptions and guides of story trophies until
  they are marked earned.
- **Search**: live filter across name, description, guide and chapter.
- **Platinum roadmap**: five phases (story → activities → crime side jobs →
  collectibles → counter grind) with ordering advice and a missables warning.
- **Missables tab**: every trophy flagged missable in the dataset (Capital Offense,
  Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There, Ten Pin).
- **Trophy detail panel**: official description, an original guide, cited sources,
  and a mark-earned button.
- **Data Source tab**: dataset composition and provenance.

## Files

```
app/index.html          page structure and tabs
app/assets/style.css    original neon look (no Rockstar assets, no external fonts)
app/assets/app.js       app logic (no libraries, no imports, no network)
app/assets/data.js      dataset embedded as window.GTA6_TROPHY_DATA (works from file://)
app/assets/data.json    same dataset as JSON
app/data/trophies.json  the competition-required dataset file (same 55 trophies)
tools/build_data.py     script that built the enriched dataset from the official list
```

## Dataset provenance — reconstructed list

**This dataset is a reconstruction, not a confirmed official list.** Grand Theft Auto VI
has not shipped at the time of writing, so no final trophy list can be verified from a
live PSN source.

- The 55 trophy names, descriptions and grades in `app/data/trophies.json` were taken
  from the competition kit's starter file (`starter/app/data/trophies.json`), which
  states it reproduces the official PlayStation list (dated 2026-11-18) as cross-listed
  by [PSNProfiles](https://psnprofiles.com) and [Exophase](https://exophase.com), the
  two sources agreeing on every name, description and grade. We did not independently
  verify those listings; treat the list as **pre-release and unconfirmed until the
  game ships**.
- Everything else — categories (story / side / collection / stunt), chapter tags,
  phase assignments, missable flags, counts, roadmap phases and every trophy guide —
  is an **original reconstruction written for this entry**, inferred from the official
  descriptions and GTA V's platinum structure. Where a guide names a source
  (PSNProfiles, Exophase, PowerPyx-style roadmaps), it is a citation of where the
  reasoning drew from, never a copy of another guide's text. Links open only when the
  reader clicks them; the app fetches nothing.
- The kit's rules state 28 of the 55 trophies are hidden on PlayStation until earned;
  the starter file carries no per-trophy hidden flags, so `hidden` is `false` on every
  item in this copy.
- No Rockstar Games logo, artwork, box art or screenshot is used anywhere.

## Data notes

- Trophy names are shown exactly as published, including
  `"T**s Ass Drug Money"` (asterisks intentional) and curly apostrophes
  (`Let’s Go Bowling`, `In The Beginning…`).
- Grade counts match the official list: 1 platinum, 2 gold, 6 silver, 46 bronze = 55.
- Each trophy item carries: `id`, `name`, `description`, `grade`, `category`
  (story/side/collection/stunt), `chapter` (when its window opens), `phase`
  (1–5 roadmap stage), `missable`, `count` (where the description tracks a number)
  and `guide` (original text with cited sources).

## License

MIT (see `LICENSE` at the repository root). Fan-made guide, not affiliated with
Rockstar Games or Sony Interactive Entertainment.

Verified offline build

## Verification

Offline checks (no network required):

- JSON data validates: `python3 -m json.tool app/data/trophies.json`
- App script syntax-checks: `node --check app/assets/app.js`
- Trophy data carries exactly 55 `Source:` citations (one per cited source),
  confirmed with `grep -c "Source:" app/data/trophies.json`
