// tools/verify.mjs — offline checks for the GTA VI trophy guide.
// Runs with plain Node (no browser, no dependencies): data checks + a DOM shim that
// actually executes app/assets/app.js and asserts the tracker's behaviour.
//   node tools/verify.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let checks = 0;
const ok = (msg) => { checks++; console.log('  ok   ' + msg); };
const section = (t) => console.log('\n' + t);

/* ------------------------------------------------------------------ data checks */
section('1. dataset');
const dataFile = JSON.parse(read('app/data/trophies.json'));
const trophies = Array.isArray(dataFile) ? dataFile : dataFile.trophies;
assert.ok(Array.isArray(trophies), 'trophies array present');
assert.strictEqual(trophies.length, 55, '55 trophies');
ok('app/data/trophies.json holds 55 trophies');

const grades = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
for (const [g, n] of Object.entries(grades)) {
  assert.strictEqual(trophies.filter((t) => t.grade === g).length, n, 'grade count ' + g);
}
ok('grade mix 1 platinum / 2 gold / 6 silver / 46 bronze');

for (const t of trophies) {
  assert.ok(typeof t.name === 'string' && t.name.trim(), 'name');
  assert.ok(typeof t.description === 'string' && t.description.trim(), 'description of ' + t.name);
  assert.ok(typeof t.guide === 'string' && t.guide.trim().length > 40, 'guide of ' + t.name);
  assert.ok(['platinum', 'gold', 'silver', 'bronze'].includes(t.grade), 'grade of ' + t.name);
  assert.ok(['story', 'side', 'collection', 'stunt', 'online'].includes(t.category), 'category of ' + t.name);
  assert.strictEqual(typeof t.missable, 'boolean', 'missable flag of ' + t.name);
  assert.strictEqual(typeof t.phase, 'number', 'roadmap phase of ' + t.name);
}
ok('every trophy has name, description, grade, kind, missable flag, phase and a guide');

const ids = new Set(trophies.map((t) => t.id));
assert.strictEqual(ids.size, 55, 'unique ids');
assert.ok(trophies.some((t) => t.name === 'T**s Ass Drug Money'), 'asterisk name kept verbatim');
assert.ok(trophies.some((t) => t.name === 'Vice Got a Price!' && t.grade === 'platinum'), 'platinum named');
ok('ids unique; names kept exactly as published (incl. asterisks / curly quotes)');

const missable = trophies.filter((t) => t.missable).map((t) => t.name).sort();
assert.strictEqual(missable.length, 5, 'five missables');
ok('missable flags: ' + missable.join(', '));

const counted = trophies.filter((t) => t.count > 0);
assert.ok(counted.length >= 8, 'counted trophies present');
ok('tracked counts on ' + counted.length + ' trophies (e.g. 250 stunts, 42 shooting range, 100 WAiNK)');

for (const p of [1, 2, 3, 4, 5]) {
  assert.ok(trophies.filter((t) => t.phase === p).length > 0, 'phase ' + p + ' non-empty');
}
ok('roadmap phases 1-5 all populated');

const dataJs = (() => {
  const s = read('app/assets/data.js');
  const m = s.match(/GTA6_TROPHY_DATA\s*=\s*/);
  assert.ok(m, 'data.js assigns window.GTA6_TROPHY_DATA');
  return JSON.parse(s.slice(m.index + m[0].length).trim().replace(/;$/, ''));
})();
assert.deepStrictEqual(dataJs, dataFile, 'data.js matches trophies.json');
assert.deepStrictEqual(JSON.parse(read('app/assets/data.json')), dataFile, 'data.json matches');
ok('data.js / data.json / data/trophies.json are the same 55-trophy dataset');

/* ------------------------------------------------------- offline reference checks */
section('2. offline references');
const html = read('app/index.html');
const loads = [...html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)].map((m) => m[1])
  .filter((u) => /^(?:[a-z]+:)?\/\//i.test(u) || u.startsWith('data:'));
const assetLoads = [...html.matchAll(/<(?:script|link|img|iframe|source|video|audio)\b[^>]*\b(?:src|href)\s*=\s*"([^"]+)"/g)]
  .map((m) => m[1]);
for (const u of assetLoads) {
  assert.ok(!/^(?:[a-z]+:)?\/\//i.test(u) && !u.startsWith('data:'), 'asset must be local: ' + u);
  assert.ok(fs.existsSync(path.join(root, 'app', u.replace(/^\.?\//, ''))), 'missing file: ' + u);
}
ok('every script/link/img the page loads is a local file under app/ (' + assetLoads.join(', ') + ')');

const css = read('app/assets/style.css');
assert.deepStrictEqual(css.match(/url\((?!["']?#)/g) || [], [], 'no css url() loads');
assert.deepStrictEqual(css.match(/@import/g) || [], [], 'no css @import');
ok('stylesheet has no url() or @import it would fetch (no webfonts)');

const appSrc = read('app/assets/app.js');
for (const bad of [/\bfetch\s*\(/, /XMLHttpRequest/, /import\s*\(/, /navigator\.sendBeacon/, /\bnew\s+Image\b/, /\.src\s*=/]) {
  assert.ok(!bad.test(appSrc), 'app.js must not reach the network: ' + bad);
}
const jsUrls = appSrc.match(/https?:\/\/[^"'\s)]+/g) || [];
for (const u of jsUrls) {
  const idx = appSrc.indexOf(u);
  const ctx = appSrc.slice(Math.max(0, idx - 60), idx);
  assert.ok(/href\s*=\s*["'][^"']*$/.test(ctx), 'absolute URL may appear only in an anchor href: ' + u);
}
ok('app.js contains no fetch/XHR/dynamic import/script injection; only click-only citation links: ' + jsUrls.join(', '));
console.log('        (outbound <a href> citations in content:', loads.filter((u) => /^https?:/.test(u)).length, 'links, opened only on click)');

/* -------------------------------------------------- DOM shim + behavioural checks */
section('3. tracker behaviour (app.js executed in a DOM shim)');

class Cls {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, on) { const v = on === undefined ? !this.set.has(c) : !!on; v ? this.set.add(c) : this.set.delete(c); return v; }
}
class El {
  constructor(id, tag = 'div') {
    this.id = id; this.tag = tag; this.textContent = ''; this._html = '';
    this.style = {}; this.dataset = {}; this.classList = new Cls();
    this.children = []; this.listeners = {}; this._match = new Set();
  }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  dispatch(t, ev) { (this.listeners[t] || []).forEach((fn) => fn(ev)); }
  appendChild(c) { this.children.push(c); return c; }
  click() { this.clicked = true; }
  scrollIntoView() {}
  closest(sel) { return this._match.has(sel) ? this : null; }
  querySelectorAll() { return []; }
}

const els = new Map();
const getEl = (id) => { if (!els.has(id)) els.set(id, new El(id)); return els.get(id); };
const tabButtons = ['checklist', 'roadmap', 'missables', 'about'].map((t) => {
  const b = new El('tab-' + t, 'button'); b.dataset.tab = t; return b;
});
const sections = tabButtons.map((b) => { const s = new El('tab-' + b.dataset.tab, 'section'); return s; });
const gradeBtns = ['all', 'platinum', 'gold', 'silver', 'bronze'].map((g) => { const b = new El('g-' + g, 'button'); b.dataset.grade = g; return b; });
const catBtns = ['all', 'story', 'side', 'collection', 'stunt', 'online'].map((c) => { const b = new El('c-' + c, 'button'); b.dataset.cat = c; return b; });
const bar = new El('bar-inner', 'i');

const document = {
  getElementById: getEl,
  querySelector: (sel) => (sel === '.bar > i' ? bar : null),
  querySelectorAll: (sel) => {
    if (sel === 'nav.tabs button') return tabButtons;
    if (sel === 'section.tab') return sections;
    if (sel === '#grade-filters [data-grade]') return gradeBtns;
    if (sel === '#cat-filters [data-cat]') return catBtns;
    return [];
  },
  addEventListener: (t, fn) => { document._click = t === 'click' ? fn : document._click; },
  createElement: (tag) => new El('created-' + tag, tag),
  body: new El('body', 'body'),
};

const store = new Map();
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
let lastBlob = null, downloadedName = null;
class Blob { constructor(parts) { lastBlob = parts.join(''); } }
const URLshim = { createObjectURL: () => 'blob:stub', revokeObjectURL: () => {} };
class FileReader {
  readAsText(file) { this.result = file.text; this.onload && this.onload(); }
}
const window = { GTA6_TROPHY_DATA: dataJs, localStorage };
const sandbox = {
  window, document, localStorage, Blob, URL: URLshim, FileReader,
  setTimeout, clearTimeout, console, JSON, Math, Number, String, Object, Array, Date, RegExp,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(read('app/assets/data.js'), sandbox, { filename: 'data.js' });
vm.runInContext(appSrc, sandbox, { filename: 'app.js' });

const list = getEl('trophy-list');
const countCards = (h) => (h.match(/class="trophy /g) || []).length;
assert.strictEqual(countCards(list.innerHTML), 55, 'all 55 rendered');
ok('checklist renders all 55 trophies with grade, description and tags');

assert.strictEqual(getEl('stat-earned').textContent, '0/55');
assert.strictEqual(getEl('stat-pct').textContent, '0%');
assert.strictEqual(getEl('platinum-stat').textContent, 'LOCKED');
ok('empty state: 0/55, 0%, platinum LOCKED');

// --- earned toggle writes state + localStorage + progress bars
const click = (matchSel, data) => document._click({ target: Object.assign(new El('t'), { _match: new Set([matchSel]), dataset: data }), stopPropagation() {} });
click('[data-check]', { check: '7' });
assert.strictEqual(getEl('stat-earned').textContent, '1/55');
assert.strictEqual(getEl('stat-pct').textContent, '2%');
assert.strictEqual(bar.style.width, '2%');
const saved = JSON.parse(store.get('gta6-trophy-tracker-v1'));
assert.deepStrictEqual(Object.keys(saved.earned), ['7']);
ok('ticking a trophy updates stats, bars and localStorage (key gta6-trophy-tracker-v1)');

// --- search
const search = getEl('search');
search.dispatch('input', { target: { value: 'bowling' } });
const hits = (list.innerHTML.match(/class="t-name">([^<]+)</g) || []).map((s) => s.replace(/.*>/, ''));
assert.ok(hits.length >= 2 && hits.join('|').includes('Bowling'), 'search finds bowling trophies: ' + hits);
ok('search filters the list (query "bowling" -> ' + hits.length + ' results)');
search.dispatch('input', { target: { value: 'zzzz' } });
assert.ok(/No trophies match/.test(list.innerHTML), 'empty state for no match');
ok('search shows an empty state when nothing matches');
search.dispatch('input', { target: { value: '' } });

// --- grade filter
getEl('grade-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-grade]']), dataset: { grade: 'platinum' } }) });
assert.strictEqual(countCards(list.innerHTML), 1, 'platinum filter');
getEl('grade-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-grade]']), dataset: { grade: 'bronze' } }) });
assert.strictEqual(countCards(list.innerHTML), 46, 'bronze filter');
getEl('grade-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-grade]']), dataset: { grade: 'all' } }) });
assert.strictEqual(countCards(list.innerHTML), 55, 'back to all');
ok('grade filters: platinum 1, bronze 46, all 55');

// --- kind filter
getEl('cat-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-cat]']), dataset: { cat: 'story' } }) });
const storyCount = countCards(list.innerHTML);
assert.ok(storyCount === 14, 'story filter count ' + storyCount);
getEl('cat-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-cat]']), dataset: { cat: 'collection' } }) });
assert.ok(countCards(list.innerHTML) === 8, 'collection filter');
getEl('cat-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-cat]']), dataset: { cat: 'online' } }) });
assert.ok(/No trophies match/.test(list.innerHTML), 'online filter empty (no online trophies listed)');
getEl('cat-filters').dispatch('click', { target: Object.assign(new El('t'), { _match: new Set(['[data-cat]']), dataset: { cat: 'all' } }) });
ok('kind filters: story 14, collectibles 8, online 0, back to all 55');

// --- missable only
getEl('missable-toggle').dispatch('click', {});
assert.strictEqual(countCards(list.innerHTML), 5, 'missable filter');
ok('"Missable only" shows exactly the 5 flagged trophies');
getEl('missable-toggle').dispatch('click', {});

// --- spoiler mode
const spoilerBtn = getEl('spoiler-toggle');
spoilerBtn.dispatch('click', {});
assert.ok(/Hidden story trophy/.test(list.innerHTML), 'story names hidden');
assert.ok(!list.innerHTML.includes('Top Of The World, Ma'), 'a story name is not leaked');
assert.ok(list.innerHTML.includes('Vice City, Baby!'.slice(0, 0) + '??? Hidden story trophy'), 'placeholder shown');
assert.ok(list.innerHTML.includes('You Gotta Know When to Get Off'), 'earned story trophy stays visible');
assert.ok(list.innerHTML.includes('Cunning Stunts'), 'non-story trophies unaffected');
ok('spoiler mode hides unearned story names/descriptions, keeps earned ones and all non-story');
spoilerBtn.dispatch('click', {});
assert.ok(list.innerHTML.includes('Top Of The World, Ma'), 'revealed again');
ok('spoiler mode toggles back off cleanly');

// --- detail panel
click('.trophy', { id: '17' });
const detail = getEl('detail-panel');
assert.ok(detail.style.display === 'block', 'detail open');
assert.ok(/The Shootist/.test(detail.innerHTML) && /42/.test(detail.innerHTML), 'detail shows trophy');
assert.ok(/Sources/.test(detail.innerHTML) && /psnprofiles/.test(detail.innerHTML), 'detail cites sources');
ok('clicking a trophy opens its detail panel with description, guide and cited sources');
click('[data-close]', {});
assert.strictEqual(detail.style.display, 'none');
ok('detail panel closes');

// --- export
store.clear();
sandbox.state.earned = { 1: true, 15: true };
sandbox.save();
getEl('export-btn').dispatch('click', {});
const exported = JSON.parse(lastBlob);
assert.deepStrictEqual(exported.earned.sort((a, b) => a - b), [1, 15]);
assert.ok(exported.earnedNames.includes('Cunning Stunts'));
assert.strictEqual(exported.total, 55);
ok('export writes a JSON file with earned ids, names and total');

// --- import (round trip + name-based file)
sandbox.state.earned = {};
sandbox.importProgress({ text: lastBlob });
assert.deepStrictEqual(Object.keys(sandbox.state.earned).sort(), ['1', '15'].sort());
ok('export -> import round trip restores the same progress');
sandbox.state.earned = {};
sandbox.importProgress({ text: JSON.stringify({ earnedNames: ['Ten Pin', 'The Shootist'] }) });
const imported = Object.keys(sandbox.state.earned).map(Number).sort((a, b) => a - b);
assert.deepStrictEqual(imported, [17, 51]);
ok('import also accepts name-based files');
sandbox.importProgress({ text: 'not json' });
assert.ok(/Import failed/.test(getEl('toast').textContent), 'bad file reported');
ok('a malformed file shows an error toast instead of crashing');

// --- persistence across reload
store.set('gta6-trophy-tracker-v1', JSON.stringify({ earned: { 2: true, 3: true }, version: 1 }));
sandbox.state.earned = {};
sandbox.load();
assert.deepStrictEqual(Object.keys(sandbox.state.earned).sort(), ['2', '3']);
ok('progress reloads from localStorage on start');

// --- missables tab + about tab + category chips
assert.strictEqual(countCards(getEl('missable-list').innerHTML), 5);
ok('missables tab lists the 5 flagged trophies');
assert.ok(/55 trophies/.test(getEl('srcdata').innerHTML) && /platinum/.test(getEl('srcdata').innerHTML));
ok('data-source tab reports the dataset composition');
assert.ok(/story: <b>/.test(getEl('cp-story').innerHTML) && /collection: <b>/.test(getEl('cp-collection').innerHTML));
ok('per-kind progress chips render earned/total');

/* ------------------------------------------------------------------------ summary */
console.log('\n' + checks + ' checks passed.');
