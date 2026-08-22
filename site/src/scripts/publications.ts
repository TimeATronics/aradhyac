const CACHE_KEY = 'aradhyac-publications-cache';

const tbody = document.querySelector('#publications-body');
const refreshBtn = document.querySelector<HTMLButtonElement>('#pub-refresh');
if (!tbody || !refreshBtn) throw new Error('publications section not found');

const embedded = JSON.parse(document.getElementById('publications-data')!.textContent ?? '[]');

function render(list: any[]) {
  tbody.innerHTML = '';
  for (const p of list) {
    const tr = document.createElement('tr');
    const t = document.createElement('td');
    t.textContent = p.title;
    const v = document.createElement('td');
    v.textContent = p.venue ?? '';
    const y = document.createElement('td');
    y.textContent = p.year ?? '';
    const l = document.createElement('td');
    const a = document.createElement('a');
    a.href = p.url ?? `https://doi.org/${p.doi}`;
    a.textContent = 'doi';
    l.append(a);
    tr.append(t, v, y, l);
    tbody.append(tr);
  }
}

const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
  try { render(JSON.parse(cached)); } catch {}
} else {
  render(embedded);
}

refreshBtn.addEventListener('click', async () => {
  refreshBtn.classList.add('is-spinning');
  refreshBtn.disabled = true;
  try {
    const res = await fetch('https://pub.orcid.org/v3.0/0009-0003-3450-5728/works', {
      headers: { Accept: 'application/json' },
    });
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
    localStorage.setItem(CACHE_KEY, JSON.stringify(works));
    render(works);
  } catch (e) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = `Refresh failed (${(e as Error).message}) - showing cached list.`;
    row.append(td);
    tbody.append(row);
  } finally {
    refreshBtn.classList.remove('is-spinning');
    refreshBtn.disabled = false;
  }
});
