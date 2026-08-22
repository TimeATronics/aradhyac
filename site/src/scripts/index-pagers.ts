const PAGE_SIZE = 5;

const esc = (v: any) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function makePager(id: string, row: (item: any) => string, onRender?: () => void) {
  let data: any[] = JSON.parse(document.getElementById(`${id}-data`)?.textContent ?? '[]');
  const list = document.querySelector(`#${id}-list`) as HTMLElement | null;
  const meta = document.querySelector(`#${id}-meta`) as HTMLElement | null;
  const pageEl = document.querySelector(`#${id}-page`) as HTMLElement | null;
  const prev = document.querySelector<HTMLButtonElement>(`#${id}-prev`);
  const next = document.querySelector<HTMLButtonElement>(`#${id}-next`);
  let page = 1;

  function render() {
    if (!list) return;
    const pages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const start = (page - 1) * PAGE_SIZE;
    list.innerHTML = data.slice(start, start + PAGE_SIZE).map(row).join('');
    if (meta) meta.textContent = `Showing ${start + 1}-${Math.min(start + PAGE_SIZE, data.length)} of ${data.length}`;
    if (pageEl) pageEl.textContent = `${page} / ${pages}`;
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
    onRender?.();
  }

  prev?.addEventListener('click', () => { page--; render(); });
  next?.addEventListener('click', () => { page++; render(); });
  render();
  return { refresh: (d: any[]) => { data = d; page = 1; render(); } };
}

const pagerMeta = (id: string) => `
  <div class="projects-meta">
    <span id="${id}-meta">Showing 1-0 of 0</span>
    <div class="projects-pager">
      <button id="${id}-prev" type="button" class="page-btn" disabled>&#9664; Prev</button>
      <span id="${id}-page">1 / 1</span>
      <button id="${id}-next" type="button" class="page-btn">Next &#9654;</button>
    </div>
  </div>`;

/* --- blogs --- */
makePager('blogs', (p: any) => `
  <li>
    <a class="post-title" href="/blog/${esc(p.slug)}/">${esc(p.title)}</a>
    <div class="post-date">${new Date(p.pubDate).toLocaleDateString()}</div>
    ${p.description ? `<p>${esc(p.description)}</p>` : ''}
  </li>`);

/* --- projects --- */
makePager('projects', (p: any) => `
  <li>
    <div>
      ${p.repo ? `<a class="post-title" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : `<span class="post-title">${esc(p.title)}</span>`}
      ${p.link ? `<a class="project-live" href="${esc(p.link)}"${p.link.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>Live</a>` : ''}
    </div>
    ${p.description ? `<p class="project-desc">${esc(p.description)}</p>` : ''}
  </li>`);

/* --- resources --- */
makePager('resources', (r: any) => `
  <tr>
    <td>${esc(r.subject)}</td>
    <td>${esc(r.course_number)}</td>
    <td>${esc(r.institution)}</td>
    <td><a href="${esc(r.url)}">notes</a></td>
  </tr>`);

/* --- publications --- */
const pubs = makePager('publications', (p: any) => `
  <tr>
    <td>${esc(p.title)}</td>
    <td>${esc(p.venue)}</td>
    <td>${esc(p.year)}</td>
    <td><a href="${esc(p.url ?? `https://doi.org/${p.doi}`)}">doi</a></td>
  </tr>`);

try {
  const cached = localStorage.getItem('aradhyac-publications-cache');
  if (cached) pubs.refresh(JSON.parse(cached));
} catch {}

document.querySelector('#pub-refresh')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLButtonElement;
  btn.classList.add('is-spinning');
  btn.disabled = true;
  try {
    const res = await fetch('https://pub.orcid.org/v3.0/0009-0003-3450-5728/works', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`ORCID API ${res.status}`);
    const data = await res.json();
    const works = (data.group ?? []).map((g: any) => {
      const w = g['work-summary'][0];
      const ext = (w['external-ids']?.['external-id'] ?? [])[0] ?? {};
      return {
        title: w.title?.title?.value ?? '',
        venue: w['journal-title']?.value ?? '',
        year: w['publication-date']?.year?.value ?? '',
        doi: ext['external-id-type'] === 'doi' ? ext['external-id-value'] : null,
        url: w.url?.value ?? null,
      };
    });
    localStorage.setItem('aradhyac-publications-cache', JSON.stringify(works));
    pubs.refresh(works);
  } catch (err) {
    const meta = document.querySelector('#publications-meta') as HTMLElement | null;
    if (meta) meta.textContent = `Refresh failed (${(err as Error).message}) - showing cached list.`;
  } finally {
    btn.classList.remove('is-spinning');
    btn.disabled = false;
  }
});

/* --- experience --- */
makePager('experience', (e: any) => `
  <div class="experience-item">
    <h3>${esc(e.position)} - <span class="experience-org">${esc(e.organization)}</span></h3>
    <div class="post-date">${esc(e.period)}</div>
    <ul>${(e.points ?? []).map((pt: string) => `<li>${esc(pt)}</li>`).join('')}</ul>
  </div>`);

/* --- music (also recolors bandcamp widgets to match the theme) --- */
function recolorMusic() {
  const music = document.getElementById('music');
  if (!music) return;
  const dark = document.documentElement.dataset.theme === 'dark';
  const bg = dark ? '0d0d0d' : 'ffffff';
  music.querySelectorAll('iframe').forEach((f) => {
    f.src = f.src.replace(/bgcol=[0-9a-f]{6}/, 'bgcol=' + bg);
  });
}

makePager('music', (m: any) => `
  <div class="music-item">
    <iframe style="border: 0; width: 100%; height: 42px;" src="${esc(m.url)}" seamless loading="lazy" title="${esc(m.title)}"></iframe>
  </div>`, recolorMusic);

recolorMusic();
new MutationObserver(recolorMusic).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

export { pagerMeta };
