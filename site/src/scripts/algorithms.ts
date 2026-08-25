/* Algorithms Practice tracker: sessions synced to a server-side store with
   localStorage as cache, targets in memory, column filters, difficulty sort,
   shift-click range marking/starring. */

const KEY_SESSIONS = 'algorithms.sessions';
const KEY_ACTIVE = 'algorithms.active';

const COLORS: Record<string, string> = { Easy: '#2f9e44', Medium: '#e8890c', Hard: '#d64545' };
const RANK: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

let progress = new Set<string>();
let starred = new Set<string>();
let targets = new Set<number>();
let active: string | null = null;
let sortDir = 0; // 0 natural, 1 easy->hard, -1 hard->easy
let lastDoneTr: HTMLTableRowElement | null = null;
let lastStarTr: HTMLTableRowElement | null = null;
let delArmed = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;

const NAME_RE = /^[a-zA-Z0-9 _.-]{1,24}$/;
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitize(s: any): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(s || {})) {
    if (BAD_KEYS.has(k) || !NAME_RE.test(k) || !v || typeof v !== 'object' || Array.isArray(v)) continue;
    out[k] = {
      session_name: v.session_name,
      progress: Array.isArray(v.progress) ? v.progress.filter((x: any) => typeof x === 'string' && x.length <= 64) : [],
      starred: Array.isArray(v.starred) ? v.starred.filter((x: any) => typeof x === 'string' && x.length <= 64) : [],
      targets: Array.isArray(v.targets)
        ? v.targets.filter((x: any) => Number.isInteger(x) && x >= 1 && x <= 100).slice(0, 30)
        : [],
    };
  }
  return out;
}

function saveLocal(s: Record<string, any>) {
  localStorage.setItem(KEY_SESSIONS, JSON.stringify(sanitize(s)));
}

function readSessions(): Record<string, any> {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY_SESSIONS) || '{}'));
  } catch {
    return {};
  }
}

function scheduleSync(s: Record<string, any>) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }, 600);
}

function writeSessions(s: Record<string, any>) {
  saveLocal(s);
  scheduleSync(s);
}

async function syncFromServer() {
  try {
    const res = await fetch('/api/sessions', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return;
    saveLocal(data);
    const name = active;
    progress = new Set();
    starred = new Set();
    targets = new Set();
    if (name && data[name]) {
      progress = new Set(data[name].progress || []);
      starred = new Set(data[name].starred || []);
      targets = new Set((data[name].targets || []).filter((x: any) => Number.isInteger(x) && x >= 1 && x <= 100));
    }
    refreshSessionOptions();
    syncTargets();
    applyRows();
    applyView();
    updateMetrics();
  } catch {}
}

function persist() {
  if (!active) return;
  const s = readSessions();
  s[active] = { session_name: active, progress: [...progress], starred: [...starred], targets: [...targets] };
  writeSessions(s);
}

function rows(): HTMLTableRowElement[] {
  return Array.from(document.querySelectorAll<HTMLTableRowElement>('#algo-body tr'));
}

function applyRows() {
  let n = 0;
  for (const tr of rows()) {
    const id = tr.dataset.id as string;
    (tr.querySelector('.done') as HTMLInputElement).checked = progress.has(id);
    const star = tr.querySelector('.star') as HTMLElement;
    const on = starred.has(id);
    if (on) n++;
    star.textContent = on ? '\u2605' : '\u2606';
    star.classList.toggle('is-starred', on);
    tr.classList.toggle('is-done', progress.has(id));
  }
  const cnt = document.getElementById('algo-starred');
  if (cnt) cnt.textContent = `Starred: ${n}`;
}

/* ---------- view: filters + sort ---------- */

function viewRows(): HTMLTableRowElement[] {
  const q = (document.getElementById('algo-search') as HTMLInputElement).value.trim().toLowerCase();
  const topic = (document.getElementById('algo-topic') as HTMLSelectElement).value;
  const diffs = new Set(
    Array.from(document.querySelectorAll<HTMLInputElement>('.diff-check'))
      .filter((el) => el.checked)
      .map((el) => el.dataset.diff),
  );
  return rows().filter((tr) => {
    const inDiff = !tr.dataset.diff || diffs.has(tr.dataset.diff);
    const inTopic = !topic || tr.dataset.step === topic;
    const inSearch = !q || ((tr as any)._q as string).includes(q);
    return inDiff && inTopic && inSearch;
  });
}

function applyView() {
  const view = viewRows();
  const shown = targets.size ? view.filter((tr) => targets.has(Number(tr.dataset.step))) : view;
  const shownSet = new Set(shown);
  let visible = 0;
  for (const tr of rows()) {
    tr.hidden = !shownSet.has(tr);
    if (!tr.hidden) visible++;
  }
  const counter = document.getElementById('algo-visible');
  if (counter) counter.textContent = `${visible} shown`;
}

function rank(tr: HTMLTableRowElement) {
  const r = RANK[tr.dataset.diff as string];
  return r === undefined ? Number.MAX_SAFE_INTEGER : r * sortDir;
}

function sortRows() {
  const tb = document.getElementById('algo-body') as HTMLElement;
  const list = rows();
  list.sort((x, y) => {
    const d = sortDir === 0 ? 0 : rank(x) - rank(y);
    return d !== 0 ? d : Number(x.dataset.idx) - Number(y.dataset.idx);
  });
  list.forEach((tr) => tb.appendChild(tr));
}

/* ---------- metrics ---------- */

function countsIn(list: HTMLTableRowElement[]) {
  const c = { Easy: 0, Medium: 0, Hard: 0 };
  const tot = { Easy: 0, Medium: 0, Hard: 0 };
  for (const tr of list) {
    const diff = tr.dataset.diff as keyof typeof tot;
    if (diff in tot) tot[diff]++;
    if (progress.has(tr.dataset.id as string) && diff in tot) c[diff]++;
  }
  return { c, tot, total: list.length };
}

function paintBar(el: HTMLElement | null, c: Record<string, number>, total: number) {
  if (!el) return;
  if (total === 0) {
    el.style.background = '';
    return;
  }
  const p1 = (c.Easy / total) * 100;
  const p2 = p1 + (c.Medium / total) * 100;
  const p3 = p2 + (c.Hard / total) * 100;
  el.style.background =
    `linear-gradient(90deg,${COLORS.Easy} 0 ${p1}%,${COLORS.Medium} ${p1}% ${p2}%,` +
    `${COLORS.Hard} ${p2}% ${p3}%,var(--border) ${p3}% 100%)`;
}

function countsText(c: Record<string, number>, t: Record<string, number>, total: number) {
  const done = c.Easy + c.Medium + c.Hard;
  return `Easy: ${c.Easy}/${t.Easy} | Medium: ${c.Medium}/${t.Medium} | Hard: ${c.Hard}/${t.Hard} | Total: ${done}/${total}`;
}

function updateMetrics() {
  const view = viewRows();
  const scoped = targets.size ? view.filter((tr) => targets.has(Number(tr.dataset.step))) : [];

  const g = countsIn(view);
  paintBar(document.getElementById('algo-g-bar'), g.c, g.total);
  const gp = document.getElementById('algo-g-pct');
  if (gp) gp.textContent = g.total ? Math.round(((g.c.Easy + g.c.Medium + g.c.Hard) / g.total) * 100) + '%' : '0%';
  const gc = document.getElementById('algo-g-counts');
  if (gc) gc.textContent = countsText(g.c, g.tot, g.total);

  const tb = document.getElementById('algo-t-block');
  if (!tb) return;
  if (!scoped.length) {
    tb.hidden = true;
  } else {
    tb.hidden = false;
    const t = countsIn(scoped);
    paintBar(document.getElementById('algo-t-bar'), t.c, t.total);
    const tp = document.getElementById('algo-t-pct');
    if (tp) tp.textContent = Math.round(((t.c.Easy + t.c.Medium + t.c.Hard) / t.total) * 100) + '%';
    const tc = document.getElementById('algo-t-counts');
    if (tc) tc.textContent = countsText(t.c, t.tot, t.total);
  }
}

/* ---------- sessions ---------- */

function refreshSessionOptions() {
  const sel = document.getElementById('algo-session') as HTMLSelectElement | null;
  if (!sel) return;
  sel.innerHTML = '';
  sel.add(new Option('-', ''));
  for (const name of Object.keys(readSessions()).sort()) sel.add(new Option(name, name));
  sel.value = active ?? '';
  const del = document.getElementById('algo-del') as HTMLButtonElement | null;
  if (del) {
    del.disabled = !active;
    if (!active) {
      delArmed = false;
      del.textContent = 'Delete';
    }
  }
}

function loadSession(name: string | null) {
  active = name;
  progress = new Set();
  starred = new Set();
  targets = new Set();
  if (name) {
    const s = readSessions()[name];
    if (s) {
      progress = new Set(s.progress || []);
      starred = new Set(s.starred || []);
      targets = new Set((s.targets || []).filter((x: any) => Number.isInteger(x) && x >= 1 && x <= 100));
    }
  }
  localStorage.setItem(KEY_ACTIVE, name ?? '');
  refreshSessionOptions();
  syncTargets();
  applyRows();
  applyView();
  updateMetrics();
}

function updateTargetSummary() {
  const el = document.getElementById('algo-target-summary');
  if (!el) return;
  const n = targets.size;
  el.textContent = n ? `Targets: ${n} topic${n > 1 ? 's' : ''}` : 'Targets: none';
}

function syncTargets() {
  document.querySelectorAll<HTMLInputElement>('.target-check').forEach((el) => {
    el.checked = targets.has(Number(el.value));
  });
  updateTargetSummary();
}

/* ---------- inline session naming ---------- */

function showName() {
  const sel = document.getElementById('algo-session') as HTMLSelectElement | null;
  const input = document.getElementById('algo-name') as HTMLInputElement | null;
  if (!sel || !input) return;
  if (!input.hidden) {
    hideName();
    return;
  }
  sel.hidden = true;
  input.hidden = false;
  input.value = '';
  input.focus();
}

function hideName() {
  const sel = document.getElementById('algo-session') as HTMLSelectElement | null;
  const input = document.getElementById('algo-name') as HTMLInputElement | null;
  if (sel) sel.hidden = false;
  if (input) {
    input.hidden = true;
    input.value = '';
  }
}

function commitName() {
  const input = document.getElementById('algo-name') as HTMLInputElement;
  const name = input.value.trim();
  if (!name) {
    hideName();
    return;
  }
  // New snapshots the current progress/starred/targets into a new named session
  const s = readSessions();
  s[name] = { session_name: name, progress: [...progress], starred: [...starred], targets: [...targets] };
  writeSessions(s);
  loadSession(name);
  hideName();
}

/* ---------- bulk range helpers ---------- */

function rangeApply(startTr: Element | null, endTr: Element | null, fn: (tr: HTMLTableRowElement) => void) {
  if (!startTr || !endTr) return;
  const list = rows();
  const a = list.indexOf(startTr as HTMLTableRowElement);
  const b = list.indexOf(endTr as HTMLTableRowElement);
  if (a < 0 || b < 0) return;
  for (let i = Math.min(a, b); i <= Math.max(a, b); i++) fn(list[i]);
}

export function init() {
  // cache lowercase titles and original order index on each row
  rows().forEach((tr, i) => {
    tr.dataset.idx = String(i);
    (tr as any)._q = (tr.querySelector('.title-cell') as HTMLElement).textContent!.toLowerCase();
  });

  // restore the previously active session (or guest) across page loads
  let restore: unknown = '';
  try {
    restore = localStorage.getItem(KEY_ACTIVE) || '';
  } catch {}
  const saved = readSessions();
  loadSession(typeof restore === 'string' && restore && saved[restore] ? restore : null);
  syncFromServer();

  const tbody = document.getElementById('algo-body');

  /* completion: click handles plain toggle and shift-range (checkbox state is
     already flipped by the time click handlers run; keyboard activation also
     dispatches click, so one handler covers everything) */
  tbody?.addEventListener('click', (e) => {
    const input = e.target as HTMLInputElement;
    if (!(input instanceof HTMLInputElement) || !input.classList.contains('done')) return;
    const tr = input.closest('tr') as HTMLTableRowElement;
    if (e.shiftKey && lastDoneTr && lastDoneTr !== tr) {
      rangeApply(lastDoneTr, tr, (r) => {
        progress[input.checked ? 'add' : 'delete'](r.dataset.id as string);
      });
    } else {
      progress[input.checked ? 'add' : 'delete'](tr.dataset.id as string);
    }
    lastDoneTr = tr;
    persist();
    applyRows();
    updateMetrics();
  });

  /* starring: plain click toggles; shift-click paints the clicked star's
     new state over the range up to the last clicked star */
  tbody?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.star') as HTMLElement | null;
    if (!btn) return;
    const tr = btn.closest('tr') as HTMLTableRowElement;
    const id = tr.dataset.id as string;
    const on = !starred.has(id);
    if (e.shiftKey && lastStarTr && lastStarTr !== tr) {
      rangeApply(lastStarTr, tr, (r) => {
        starred[on ? 'add' : 'delete'](r.dataset.id as string);
      });
    } else {
      starred[on ? 'add' : 'delete'](id);
    }
    lastStarTr = tr;
    persist();
    applyRows();
  });

  document.querySelectorAll<HTMLInputElement>('.diff-check').forEach((el) =>
    el.addEventListener('change', () => {
      applyView();
      updateMetrics();
    }),
  );

  document.getElementById('algo-search')?.addEventListener('input', () => {
    applyView();
    updateMetrics();
  });
  document.getElementById('algo-topic')?.addEventListener('change', () => {
    applyView();
    updateMetrics();
  });

  const sortBtn = document.getElementById('algo-diff-sort');
  sortBtn?.addEventListener('click', () => {
    sortDir = sortDir === 1 ? -1 : sortDir === -1 ? 0 : 1;
    sortBtn.textContent = sortDir === 1 ? '\u2191' : sortDir === -1 ? '\u2193' : '\u2195';
    sortBtn.title = sortDir === 1 ? 'sorted easy -> hard' : sortDir === -1 ? 'sorted hard -> easy' : 'sort by difficulty';
    sortRows();
  });

  document.querySelectorAll<HTMLInputElement>('.target-check').forEach((el) =>
    el.addEventListener('change', () => {
      targets = new Set(
        Array.from(document.querySelectorAll<HTMLInputElement>('.target-check:checked')).map((c) => Number(c.value)),
      );
      updateTargetSummary();
      persist();
      applyView();
      updateMetrics();
    }),
  );

  document.getElementById('algo-target-clear')?.addEventListener('click', () => {
    targets.clear();
    document.querySelectorAll<HTMLInputElement>('.target-check').forEach((el) => (el.checked = false));
    updateTargetSummary();
    persist();
    applyView();
    updateMetrics();
  });

  /* close the targets dropdown when clicking anywhere outside it (native-like) */
  const targetBox = document.querySelector<HTMLElement>('.target-wrap');
  if (targetBox) {
    document.addEventListener('click', (e) => {
      if (!targetBox.contains(e.target as Node)) targetBox.open = false;
    });
  }

  (document.getElementById('algo-session') as HTMLSelectElement).addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value;
    loadSession(v || null);
  });

  const nameInput = document.getElementById('algo-name') as HTMLInputElement;
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitName();
    else if (e.key === 'Escape') hideName();
  });
  nameInput.addEventListener('blur', () => setTimeout(hideName, 150));

  document.getElementById('algo-new')?.addEventListener('click', showName);

  document.getElementById('algo-del')?.addEventListener('click', () => {
    if (!active) return;
    const del = document.getElementById('algo-del') as HTMLButtonElement;
    if (!delArmed) {
      delArmed = true;
      del.textContent = 'Sure?';
      setTimeout(() => {
        delArmed = false;
        del.textContent = 'Delete';
      }, 2500);
      return;
    }
    const s = readSessions();
    delete s[active];
    writeSessions(s);
    loadSession(null);
  });
}
