const PAGE_SIZE = 5;

const listEl = document.querySelector('#blog-list');
const metaEl = document.querySelector('#blog-meta');
const pageInfoEl = document.querySelector('#blog-page');
const prevBtn = document.querySelector<HTMLButtonElement>('#blog-prev');
const nextBtn = document.querySelector<HTMLButtonElement>('#blog-next');

const posts: any[] = JSON.parse(document.getElementById('blog-data')!.textContent ?? '[]');
let page = 1;

function render() {
  if (!listEl || !metaEl || !pageInfoEl) return;
  const pages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const items = posts.slice(start, start + PAGE_SIZE);

  listEl.innerHTML = '';
  for (const p of items) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'post-title';
    a.href = `/blog/${p.slug}/`;
    a.textContent = p.title;
    li.append(a);
    const d = document.createElement('div');
    d.className = 'post-date';
    d.textContent = new Date(p.pubDate).toLocaleDateString();
    li.append(d);
    if (p.description) {
      const desc = document.createElement('p');
      desc.textContent = p.description;
      li.append(desc);
    }
    listEl.append(li);
  }

  metaEl.textContent = `Showing ${start + 1}-${Math.min(start + PAGE_SIZE, posts.length)} of ${posts.length}`;
  pageInfoEl.textContent = `${page} / ${pages}`;
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= pages;
}

prevBtn?.addEventListener('click', () => { page--; render(); });
nextBtn?.addEventListener('click', () => { page++; render(); });

render();
