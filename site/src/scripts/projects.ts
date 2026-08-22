const PAGE_SIZE = 5;

const listEl = document.querySelector('#projects-list');
const metaEl = document.querySelector('#projects-meta');
const pageInfoEl = document.querySelector('#projects-page');
const prevBtn = document.querySelector<HTMLButtonElement>('#projects-prev');
const nextBtn = document.querySelector<HTMLButtonElement>('#projects-next');

const projects: any[] = JSON.parse(document.getElementById('projects-data')!.textContent ?? '[]');
let page = 1;

function render() {
  if (!listEl || !metaEl || !pageInfoEl) return;
  const pages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const items = projects.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = '';
  for (const p of items) {
    const li = document.createElement('li');
    const titleWrap = document.createElement('div');
    if (p.repo) {
      const a = document.createElement('a');
      a.className = 'post-title';
      a.href = p.repo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = p.title;
      titleWrap.append(a);
    } else {
      const s = document.createElement('span');
      s.className = 'post-title';
      s.textContent = p.title;
      titleWrap.append(s);
    }
    if (p.link) {
      const a = document.createElement('a');
      a.className = 'project-live';
      a.href = p.link;
      if (p.link.startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      a.textContent = 'Live';
      titleWrap.append(a);
    }
    li.append(titleWrap);
    if (p.description) {
      const d = document.createElement('p');
      d.className = 'project-desc';
      d.textContent = p.description;
      li.append(d);
    }
    listEl.append(li);
  }

  metaEl.textContent = `Showing ${start + 1}-${Math.min(start + PAGE_SIZE, projects.length)} of ${projects.length}`;
  pageInfoEl.textContent = `${page} / ${pages}`;
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= pages;
}

prevBtn?.addEventListener('click', () => { page--; render(); });
nextBtn?.addEventListener('click', () => { page++; render(); });

render();
