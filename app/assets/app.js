/* GTA VI Trophy Guide & Tracker — tracker logic.
   Everything runs locally: no fetch, no network, no external assets.
   Progress lives in localStorage; the dataset comes from data.js. */
'use strict';

var DATA = window.GTA6_TROPHY_DATA;
var TROPHIES = DATA.trophies;

var STORE_KEY = 'gta6-trophy-tracker-v1';
var GRADES = ['platinum', 'gold', 'silver', 'bronze'];
var CATS = ['story', 'side', 'collection', 'stunt', 'online'];

var state = {
  earned: {},          // trophy id -> true
  spoiler: false,      // hides unearned story/platinum details
  filters: { grade: 'all', cat: 'all', missableOnly: false },
  query: '',
  openId: null,
  tab: 'checklist'
};

/* ---------------- saved progress ---------------- */
function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    var saved = JSON.parse(raw);
    if (saved && typeof saved === 'object' && saved.earned) state.earned = saved.earned;
  } catch (e) { /* unreadable storage: start with a clean slate */ }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: state.earned,
      savedAt: new Date().toISOString(),
      version: 1
    }));
  } catch (e) { /* storage blocked (private mode): tracking still works in memory */ }
}

/* ---------------- small utilities ---------------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function medalIcon(g) {
  return { platinum: '\u25C9', gold: '\u2B50', silver: '\u25CE', bronze: '\u25CB' }[g] || '\u25CB';
}

function isEarned(t) { return !!state.earned[t.id]; }

function isSpoiled(t) {
  return state.spoiler && !isEarned(t) && (t.category === 'story' || t.grade === 'platinum');
}

function visibleTrophies() {
  var q = state.query.trim().toLowerCase();
  return TROPHIES.filter(function (t) {
    if (state.filters.grade !== 'all' && t.grade !== state.filters.grade) return false;
    if (state.filters.cat !== 'all' && t.category !== state.filters.cat) return false;
    if (state.filters.missableOnly && !t.missable) return false;
    if (q) {
      var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.chapter).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

/* Source list: use the explicit field when present, otherwise pull the
   trailing "Sources: ..." sentence out of the guide text. */
function trophySources(t) {
  if (Array.isArray(t.sources) && t.sources.length) return t.sources.map(String);
  var m = (t.guide || '').match(/(?:^|\.\s|\u2014\s)Sources?:\s*(.+?)\.?\s*$/);
  return m ? m[1].split(/\s*;\s*/).filter(Boolean) : [];
}

function sourceChipsHTML(t) {
  var srcs = trophySources(t);
  if (!srcs.length) return '';
  return '<div class="src-chips">' + srcs.map(function (s) {
    return '<span class="src-chip" title="' + esc(s) + '">' + esc(s) + '</span>';
  }).join('') + '</div>';
}

/* ---------------- rendering ---------------- */
function renderStats() {
  var earnedCount = TROPHIES.filter(isEarned).length;
  var total = TROPHIES.length;
  var pct = total ? Math.round(earnedCount / total * 100) : 0;
  document.getElementById('stat-earned').textContent = earnedCount + '/' + total;
  document.getElementById('stat-pct').textContent = pct + '%';
  document.getElementById('stat-missable-open').textContent =
    TROPHIES.filter(function (t) { return t.missable && !isEarned(t); }).length;
  document.getElementById('platinum-stat').textContent = isEarned(TROPHIES[0]) ? 'UNLOCKED' : 'LOCKED';
  document.getElementById('pct-label').textContent = pct + '%';
  document.querySelector('.bar > i').style.width = pct + '%';
  CATS.forEach(function (c) {
    var list = TROPHIES.filter(function (t) { return t.category === c; });
    if (!list.length) return;
    var e = list.filter(isEarned).length;
    var el = document.getElementById('cp-' + c);
    if (el) el.innerHTML = c + ': <b>' + e + '/' + list.length + '</b>';
  });
}

function earnedTag(t) {
  return isEarned(t) ? '<span class="tag earned-t">earned</span>' : '';
}

function trophyHTML(t) {
  var earned = isEarned(t);
  var spoiled = isSpoiled(t);
  var name = spoiled ? '??? Hidden story trophy' : t.name;
  var desc = spoiled ? 'Earned automatically by playing the story — earn it to reveal.' : t.description;
  var tags = [
    '<span class="tag">' + esc(t.grade) + '</span>',
    '<span class="tag">' + esc(t.category) + '</span>',
    '<span class="tag">Ch: ' + esc(t.chapter) + '</span>'
  ];
  if (t.missable) tags.push('<span class="tag missable">missable</span>');
  if (t.hidden && !spoiled) tags.push('<span class="tag hidden-t">hidden on PSN</span>');
  if (t.count) tags.push('<span class="tag">count: ' + t.count + '</span>');
  if (earned) tags.push('<span class="tag earned-t">earned</span>');
  return '<div class="trophy ' + (earned ? 'earned' : '') + (spoiled ? ' spoiled' : '') +
    (t.missable ? ' missable-flag' : '') + '" data-id="' + t.id + '">' +
    '<div class="medal ' + t.grade + '">' + medalIcon(t.grade) + '</div>' +
    '<div class="t-main"><div class="t-name">' + esc(name) + '</div>' +
    '<div class="t-desc">' + esc(desc) + '</div>' +
    '<div class="t-tags">' + tags.join('') + '</div>' +
    sourceChipsHTML(t) + '</div></div>' +
    '<div class="t-check" data-check="' + t.id + '" title="Toggle earned">' + (earned ? '\u2713' : '') + '</div>' +
    '</div>';
}

function renderList() {
  var list = visibleTrophies();
  var el = document.getElementById('trophy-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty">No trophies match the current filters.</div>';
    return;
  }
  el.innerHTML = list.map(trophyHTML).join('');
}

function renderDetail() {
  var el = document.getElementById('detail-panel');
  var t = TROPHIES.filter(function (x) { return x.id === state.openId; })[0];
  if (!t) { el.innerHTML = ''; el.style.display = 'none'; return; }
  var spoiled = isSpoiled(t);
  var guide = spoiled
    ? 'Spoiler mode is ON and this story trophy is not earned yet — mark it earned to reveal the guide.'
    : t.guide;
  el.style.display = 'block';
  el.innerHTML =
    '<button class="close-x" data-close="1" title="Close">&times;</button>' +
    '<h3>' + (spoiled ? '???' : esc(t.name)) + '</h3>' +
    '<div class="t-tags" style="margin-top:6px">' +
      '<span class="tag">' + esc(t.grade) + '</span>' +
      '<span class="tag">' + esc(t.category) + '</span>' +
      '<span class="tag">Ch: ' + esc(t.chapter) + '</span>' +
      (t.missable ? '<span class="tag missable">MISSABLE</span>' : '') +
      earnedTag(t) +
    '</div>' +
    '<h4>Official description</h4><p>' + (spoiled ? 'Hidden until earned.' : esc(t.description)) + '</p>' +
    '<h4>Guide</h4><p>' + esc(guide) + '</p>' +
    '<h4>Sources</h4>' +
    '<div class="src-chips" style="margin-top:4px">' + sourceChipsHTML(t).replace(/^<div class="src-chips">|<\/div>$/g, '') + '</div>' +
    '<p class="src">Official PlayStation trophy name &amp; description &mdash; as published on PSNProfiles and Exophase (both lists agree). ' +
    'Guide text: original work for this entry, written from the official description.</p>' +
    '<p class="src" style="margin-top:8px"><a href="https://psnprofiles.com/trophies" target="_blank" rel="noreferrer">PSNProfiles</a> &middot; ' +
    '<a href="https://psnprofiles.com" target="_blank" rel="noreferrer">Exophase</a></p>' +
    (t.missable ? '<p class="missnote" style="color:var(--pink);margin-top:12px">&#9888; Flagged MISSABLE' +
      ' &mdash; plan it before it can slip away (see the Roadmap).</p>' : '') +
    '<div style="margin-top:16px"><button class="btn primary" data-check="' + t.id + '">' +
      (isEarned(t) ? 'Mark NOT earned' : 'Mark earned') + '</button></div>';
}

function render() {
  renderStats();
  renderList();
  renderDetail();
}

/* ---------------- export / import ---------------- */
function exportProgress() {
  var payload = {
    app: 'gta6-trophy-tracker', version: 1,
    game: 'Grand Theft Auto VI (PS5) trophies',
    earned: TROPHIES.filter(isEarned).map(function (t) { return t.id; }),
    earnedNames: TROPHIES.filter(isEarned).map(function (t) { return t.name; }),
    total: TROPHIES.length,
    exportedAt: new Date().toISOString()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function toast(msg) {
  var el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:26px;z-index:60;' +
      'background:#1e1536;color:#fff;border:1px solid var(--pink);border-radius:10px;' +
      'padding:12px 20px;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,0.6);max-width:80vw;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.style.display = 'none'; }, 3500);
}

function importProgress(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var data = JSON.parse(reader.result);
      var ids = {};
      (data.earned || []).forEach(function (id) { ids[id] = true; });
      // name-based exports are accepted too
      if (data.earnedNames) {
        TROPHIES.forEach(function (t) {
          if (data.earnedNames.indexOf(t.name) !== -1) ids[t.id] = true;
        });
      }
      state.earned = ids;
      save();
      render();
      toast('Progress imported: ' + Object.keys(ids).length + ' trophies earned.');
    } catch (e) {
      toast('Import failed: not a valid progress JSON file.');
    }
  };
  reader.readAsText(file);
}

/* ---------------- events ---------------- */
function setTab(name) {
  state.tab = name;
  document.querySelectorAll('nav.tabs button').forEach(function (b) {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('section.tab').forEach(function (s) {
    s.classList.toggle('active', s.id === 'tab-' + name);
  });
}

function setSeg(groupId, key, value) {
  document.querySelectorAll('#' + groupId + ' [data-' + key + ']').forEach(function (b) {
    b.classList.toggle('on', b.dataset[key] === value);
  });
}

document.addEventListener('click', function (ev) {
  var check = ev.target.closest('[data-check]');
  if (check) {
    ev.stopPropagation();
    var id = Number(check.dataset.check);
    if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
    save(); render();
    return;
  }
  if (ev.target.closest('[data-close]')) { state.openId = null; renderDetail(); return; }
  var card = ev.target.closest('.trophy');
  if (card) { state.openId = Number(card.dataset.id); renderDetail(); card.scrollIntoView({ block: 'nearest' }); }
});

document.getElementById('search').addEventListener('input', function (e) {
  state.query = e.target.value; renderList();
});
document.getElementById('grade-filters').addEventListener('click', function (e) {
  var b = e.target.closest('[data-grade]');
  if (!b) return;
  state.filters.grade = b.dataset.grade;
  setSeg('grade-filters', 'grade', state.filters.grade);
  renderList();
});
document.getElementById('cat-filters').addEventListener('click', function (e) {
  var b = e.target.closest('[data-cat]');
  if (!b) return;
  state.filters.cat = b.dataset.cat;
  setSeg('cat-filters', 'cat', state.filters.cat);
  renderList();
});
document.getElementById('missable-toggle').addEventListener('click', function () {
  state.filters.missableOnly = !state.filters.missableOnly;
  document.getElementById('missable-toggle').classList.toggle('on', state.filters.missableOnly);
  renderList();
});
document.getElementById('spoiler-toggle').addEventListener('click', function () {
  state.spoiler = !state.spoiler;
  document.getElementById('spoiler-toggle').classList.toggle('on', state.spoiler);
  render();
});
document.getElementById('export-btn').addEventListener('click', exportProgress);
document.getElementById('import-btn').addEventListener('click', function () {
  document.getElementById('import-file').click();
});
document.getElementById('import-file').addEventListener('change', function (e) {
  if (e.target.files[0]) importProgress(e.target.files[0]);
  e.target.value = '';
});

/* reset asks for a second click within 4s before wiping progress */
var resetArmed = false;
document.getElementById('reset-btn').addEventListener('click', function (ev) {
  var btn = ev.currentTarget;
  if (!resetArmed) {
    resetArmed = true;
    btn.textContent = 'Confirm reset?';
    btn.classList.add('on');
    setTimeout(function () {
      resetArmed = false;
      btn.textContent = 'Reset';
      btn.classList.remove('on');
    }, 4000);
    return;
  }
  resetArmed = false;
  btn.textContent = 'Reset';
  btn.classList.remove('on');
  state.earned = {};
  save();
  render();
  toast('Progress reset.');
});

document.querySelectorAll('nav.tabs button').forEach(function (b) {
  b.addEventListener('click', function () { setTab(b.dataset.tab); });
});

/* ---------------- missables + about tabs ---------------- */
function renderMissables() {
  var miss = TROPHIES.filter(function (t) { return t.missable; });
  document.getElementById('missable-list').innerHTML =
    miss.length ? miss.map(trophyHTML).join('') : '<div class="empty">No missable trophies flagged.</div>';
}

function renderAbout() {
  document.getElementById('srcdata').innerHTML =
    '<div class="note" style="font-size:13px">Dataset: ' + TROPHIES.length + ' trophies — ' +
    GRADES.map(function (g) {
      return TROPHIES.filter(function (t) { return t.grade === g; }).length + ' ' + g;
    }).join(', ') + '. Categories: ' +
    CATS.filter(function (c) {
      return TROPHIES.some(function (t) { return t.category === c; });
    }).map(function (c) {
      return c + ' ' + TROPHIES.filter(function (t) { return t.category === c; }).length;
    }).join(', ') + '.</div>';
}

/* ---------------- boot ---------------- */
load();
setTab('checklist');
render();
renderMissables();
renderAbout();
document.getElementById('pct-label').textContent = document.getElementById('stat-pct').textContent;
