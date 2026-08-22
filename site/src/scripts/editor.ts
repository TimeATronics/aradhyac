const $ = (id: string) => document.getElementById(id) as HTMLElement;
let data: any = {};
let section: string;

const status = (msg: string, cls = '') => {
  const s = $('status');
  s.textContent = msg;
  s.className = cls;
};

const api = async (path: string, opts: any = {}) => {
  const res = await fetch('/api/edit' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || `${res.status}`);
  return j;
};

const esc = (v: any) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function field(label: string, value: any, placeholder = '', type = 'input') {
  if (type === 'textarea') {
    return `<label>${label}</label><textarea data-f="1" placeholder="${placeholder}" rows="8">${esc(value)}</textarea>`;
  }
  return `<label>${label}</label><input data-f="1" value="${esc(value)}" placeholder="${placeholder}" />`;
}

/* ---------- auth ---------- */

async function checkAuth() {
  try {
    const a = await api('/me', { method: 'GET' });
    if (a.authed) {
      $('login').classList.add('hidden');
      $('app').classList.remove('hidden');
      if (a.user?.login) $('user-name').textContent = '@' + a.user.login;
      await load();
    } else if (a.oauthAuth) {
      $('gh-login').classList.remove('hidden');
    } else {
      $('login-err').textContent = 'GitHub login is not configured on this server.';
    }
  } catch {
    $('login-err').textContent = 'Editor service unreachable.';
  }
}

$('gh-login').onclick = () => { location.href = '/api/edit/oauth/start?return=' + (location.hash.slice(1) || 'projects'); };
$('logout').onclick = async () => { await api('/logout', { method: 'POST' }); location.reload(); };
$('theme-toggle').onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
};
$('view-site').onclick = () => { location.href = '/'; };

async function load() {
  data = await api('/data', { method: 'GET' });
  section = location.hash.slice(1) || 'projects';
  render();
}

window.addEventListener('hashchange', () => { section = location.hash.slice(1) || 'projects'; render(); });

function render() {
  if (!['projects', 'experience', 'profile', 'resources', 'music', 'blogs'].includes(section)) {
    section = 'projects';
  }
  document.querySelectorAll('header nav a').forEach((a) => a.classList.toggle('active', a.hash.slice(1) === section));
  $('section-title').textContent = section.charAt(0).toUpperCase() + section.slice(1);
  $('save-bar').classList.toggle('hidden', section === 'blogs');
  $('content').innerHTML = '';
  if (section === 'projects') renderProjects();
  else if (section === 'experience') renderExperience();
  else if (section === 'profile') renderProfile();
  else if (section === 'resources') renderResources();
  else if (section === 'music') renderMusic();
  else if (section === 'blogs') renderBlogs();
}

/* ---------- Projects ---------- */

let repos: any[] = [];
let repoPage = 1;
const REPO_PAGE_SIZE = 10;

function renderProjects() {
  const c = $('content');
  c.innerHTML = `
    <p class="muted">Select repos from GitHub to add, then edit the entries below. Title and description are required.</p>
    <table class="repo-table" id="repo-table">
      <thead><tr><th></th><th>Repo</th><th>Description</th></tr></thead>
      <tbody id="repo-rows"></tbody>
    </table>
    <div class="pager">
      <button id="repo-prev">&#9664; Prev</button>
      <span id="repo-page">1 / 1</span>
      <button id="repo-next">Next &#9654;</button>
      <button id="repo-add" class="primary" style="margin-left:auto">Add selected</button>
    </div>
    <hr />
    <div id="project-cards"></div>
    <button id="add-project">+ Add custom entry</button>`;

  const renderRepoTable = () => {
    const total = repos.length;
    const pages = Math.max(1, Math.ceil(total / REPO_PAGE_SIZE));
    repoPage = Math.min(repoPage, pages);
    const start = (repoPage - 1) * REPO_PAGE_SIZE;
    $('repo-rows').innerHTML = repos.slice(start, start + REPO_PAGE_SIZE).map((r, i) => `
      <tr data-i="${start + i}">
        <td><input type="checkbox" class="repo-check" /></td>
        <td><a href="${r.html_url}" target="_blank" rel="noopener noreferrer" class="name">${esc(r.name)}</a></td>
        <td class="desc">${esc(r.description ?? '')}</td>
      </tr>`).join('');
    $('repo-page').textContent = `${repoPage} / ${pages}`;
    $('repo-prev').disabled = repoPage <= 1;
    $('repo-next').disabled = repoPage >= pages;
  };

  $('repo-prev').onclick = () => { repoPage--; renderRepoTable(); };
  $('repo-next').onclick = () => { repoPage++; renderRepoTable(); };
  $('repo-add').onclick = () => {
    const checked = [...document.querySelectorAll<HTMLInputElement>('.repo-check:checked')].map((cb) =>
      Number((cb.closest('tr') as HTMLElement).dataset.i));
    checked.forEach((i) => {
      const r = repos[i];
      if (!data.projects.some((p: any) => p.repo === r.html_url)) {
        data.projects.push({ title: r.name, description: r.description ?? '', repo: r.html_url, link: '' });
      }
    });
    renderProjects();
    status(`Added ${checked.length} repo(s). Edit details below, then Save.`, 'ok');
  };

  fetch('https://api.github.com/users/TimeATronics/repos?sort=updated&per_page=100')
    .then((r) => r.json())
    .then((list) => {
      repos = list.map((x: any) => ({
        name: x.name,
        html_url: x.html_url,
        description: x.description,
      }));
      renderRepoTable();
    })
    .catch((e) => status('Failed to load repos: ' + e.message, 'err'));

  renderCards();
}

function renderCards() {
  const list = $('project-cards');
  list.innerHTML = data.projects.map((p: any, i: number) => `
    <div class="card" data-i="${i}">
      <div class="card-head">
        <span class="muted">#${i + 1}</span>
        <button class="danger remove">Remove</button>
      </div>
      ${field('Title *', p.title)}
      ${field('Description *', p.description, '', 'textarea')}
      <div class="row">
        <div>${field('Repository link', p.repo)}</div>
        <div>${field('Live link', p.link)}</div>
      </div>
    </div>`).join('');

  list.querySelectorAll('.card').forEach((card) => {
    const i = Number((card as HTMLElement).dataset.i);
    card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]').forEach((el, k) => {
      const keys = ['title', 'description', 'repo', 'link'];
      el.oninput = () => { data.projects[i][keys[k]] = el.value; };
    });
    card.querySelector('.remove')!.addEventListener('click', () => {
      data.projects.splice(i, 1);
      renderCards();
    });
  });

  $('add-project').onclick = () => {
    data.projects.push({ title: '', description: '', repo: '', link: '' });
    renderCards();
  };
}

/* ---------- Experience ---------- */

function renderExperience() {
  const c = $('content');
  c.innerHTML = `<div id="exp-cards"></div><button id="add-exp">+ Add entry</button>`;
  const list = $('exp-cards');
  list.innerHTML = data.experience.map((e: any, i: number) => `
    <div class="card" data-i="${i}">
      <div class="card-head"><span class="muted">#${i + 1}</span><button class="danger remove">Remove</button></div>
      <div class="row">
        <div>${field('Position *', e.position)}</div>
        <div>${field('Organization *', e.organization)}</div>
      </div>
      ${field('Time period', e.period)}
      ${field('Work done (one point per line)', e.points.join('\n'), '', 'textarea')}
    </div>`).join('');

  list.querySelectorAll('.card').forEach((card) => {
    const i = Number((card as HTMLElement).dataset.i);
    card.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]').forEach((el, k) => {
      if (k < 3) el.oninput = () => { data.experience[i][['position', 'organization', 'period'][k]] = el.value; };
      else el.oninput = () => { data.experience[i].points = el.value.split('\n').map((s) => s.trim()).filter(Boolean); };
    });
    card.querySelector('.remove')!.addEventListener('click', () => { data.experience.splice(i, 1); renderExperience(); });
  });

  $('add-exp').onclick = () => {
    data.experience.push({ position: '', organization: '', period: '', points: [] });
    renderExperience();
  };
}

/* ---------- Profile ---------- */

function renderProfile() {
  const p = data.profile;
  const c = $('content');
  c.innerHTML = `
    ${field('Name *', p.name)}
    ${field('Tagline', p.tagline)}
    ${field('About (one paragraph per line)', p.about.join('\n'), '', 'textarea')}
    <label>Links</label>
    <div id="links"></div>
    <button id="add-link">+ Add link</button>`;

  const bind = () => {
    c.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('#content > [data-f]').forEach((el, k) => {
      if (k === 0) el.oninput = () => { p.name = el.value; };
      else if (k === 1) el.oninput = () => { p.tagline = el.value; };
      else if (k === 2) el.oninput = () => { p.about = el.value.split('\n').map((s) => s.trim()).filter(Boolean); };
    });
  };
  bind();

  const renderLinks = () => {
    $('links').innerHTML = Object.entries(p.links).map(([k, v], i) => `
      <div class="row" style="margin-bottom:0.4rem">
        <div><input data-lk data-i="${i}" placeholder="Label (GitHub)" value="${esc(k)}" /></div>
        <div><input data-lv data-i="${i}" placeholder="URL" value="${esc(v)}" /></div>
        <button class="danger" data-rm="${i}">Remove</button>
      </div>`).join('');
    $('links').querySelectorAll<HTMLInputElement>('[data-lk]').forEach((el) => {
      el.oninput = () => {
        const i = el.dataset.i!;
        const keys = Object.keys(p.links);
        const v = p.links[keys[i]];
        delete p.links[keys[i]];
        p.links[el.value] = v;
      };
    });
    $('links').querySelectorAll<HTMLInputElement>('[data-lv]').forEach((el) => {
      el.oninput = () => { p.links[Object.keys(p.links)[el.dataset.i]] = el.value; };
    });
    $('links').querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((el) => {
      el.onclick = () => { delete p.links[Object.keys(p.links)[el.dataset.rm]]; renderProfile(); };
    });
  };
  renderLinks();

  $('add-link').onclick = () => { p.links['New link'] = ''; renderLinks(); };
}

/* ---------- Resources ---------- */

function renderResources() {
  const c = $('content');
  c.innerHTML = `
    <table>
      <thead><tr><th>Subject *</th><th>Course</th><th>Institution</th><th>Link</th><th></th></tr></thead>
      <tbody id="res-rows"></tbody>
    </table>
    <button id="add-res">+ Add row</button>`;

  const renderRows = () => {
    $('res-rows').innerHTML = data.resources.map((r: any, i: number) => `
      <tr data-i="${i}">
        <td><input data-f="0" value="${esc(r.subject)}" /></td>
        <td><input data-f="1" value="${esc(r.course_number)}" /></td>
        <td><input data-f="2" value="${esc(r.institution)}" /></td>
        <td><input data-f="3" value="${esc(r.url)}" /></td>
        <td><button class="danger remove">Remove</button></td>
      </tr>`).join('');
    $('res-rows').querySelectorAll('tr').forEach((tr) => {
      const i = Number((tr as HTMLElement).dataset.i);
      tr.querySelectorAll<HTMLInputElement>('[data-f]').forEach((el) => {
        el.oninput = () => {
          const keys = ['subject', 'course_number', 'institution', 'url'];
          data.resources[i][keys[Number(el.dataset.f)]] = el.value;
        };
      });
      tr.querySelector('.remove')!.addEventListener('click', () => { data.resources.splice(i, 1); renderRows(); });
    });
  };
  renderRows();

  $('add-res').onclick = () => {
    data.resources.push({ subject: '', course_number: '', institution: '', url: '' });
    renderRows();
  };
}

/* ---------- Music ---------- */

function renderMusic() {
  const c = $('content');
  c.innerHTML = `<div id="music-rows"></div><button id="add-music">+ Add track</button>`;
  const renderRows = () => {
    $('music-rows').innerHTML = data.music.map((m: any, i: number) => `
      <div class="card" data-i="${i}">
        <div class="card-head"><span class="muted">#${i + 1}</span><button class="danger remove">Remove</button></div>
        ${field('Title *', m.title)}
        ${field('Bandcamp embed URL *', m.url, 'https://bandcamp.com/EmbeddedPlayer/track=...')}
      </div>`).join('');
    $('music-rows').querySelectorAll('.card').forEach((card) => {
      const i = Number((card as HTMLElement).dataset.i);
      card.querySelectorAll<HTMLInputElement>('[data-f]').forEach((el, k) => {
        el.oninput = () => { data.music[i][['title', 'url'][k]] = el.value; };
      });
      card.querySelector('.remove')!.addEventListener('click', () => { data.music.splice(i, 1); renderRows(); });
    });
  };
  renderRows();
  $('add-music').onclick = () => { data.music.push({ title: '', url: '' }); renderRows(); };
}

/* ---------- Blogs ---------- */

let posts: any[] = [];
let currentPost: any = null;

async function renderBlogs() {
  const c = $('content');
  c.innerHTML = `
    <div class="toolbar">
      <select id="blog-select"></select>
      <button id="blog-new">+ New post</button>
    </div>
    <div id="blog-form"></div>`;

  try {
    posts = await api('/blog', { method: 'GET' });
  } catch (e: any) {
    status(e.message, 'err');
    posts = [];
  }
  const sel = $('blog-select') as HTMLSelectElement;
  sel.innerHTML = posts.map((p) => `<option value="${esc(p.name)}">${esc(p.name.replace(/\.md$/, ''))}</option>`).join('');
  sel.onchange = () => openPost(sel.value);
  $('blog-new').onclick = () => { currentPost = null; renderBlogForm({}); };
  if (posts.length) await openPost(sel.value);
  else renderBlogForm({});
}

async function openPost(name: string) {
  try {
    currentPost = await api('/blog/' + encodeURIComponent(name), { method: 'GET' });
    renderBlogForm(currentPost);
  } catch (e: any) { status(e.message, 'err'); }
}

function parseFront(content: string) {
  const m = (content || '').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm: any = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
    }
  }
  return { fm, body: m ? m[2] : content || '' };
}

function renderBlogForm(p: any) {
  const { fm, body } = parseFront(p.content ?? '');
  $('blog-form').innerHTML = `
    ${field('Title *', fm.title ?? '')}
    <div class="row">
      <div>${field('Date', fm.pubDate ?? '', 'YYYY-MM-DD')}</div>
      <div>${field('Description', fm.description ?? '')}</div>
    </div>
    ${field('Tags (comma separated)', (fm.tags ?? '').replace(/^\[|\]$/g, '').replace(/"/g, ''))}
    ${field('Body (Markdown) *', body, '', 'textarea')}
    <div class="toolbar">
      <button id="blog-del" class="danger">Delete post</button>
    </div>`;

  const form: any = { fm, body };
  $('blog-form').querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]').forEach((el, k) => {
    if (k === 0) el.oninput = () => { form.fm.title = el.value; };
    else if (k === 1) el.oninput = () => { form.fm.pubDate = el.value; };
    else if (k === 2) el.oninput = () => { form.fm.description = el.value; };
    else if (k === 3) el.oninput = () => { form.tags = el.value; };
    else el.oninput = () => { form.body = el.value; };
  });

  $('blog-del').onclick = async () => {
    if (!currentPost?.sha || !currentPost?.name) return;
    if (!confirm('Delete this post?')) return;
    try {
      await api('/blog/' + encodeURIComponent(currentPost.name), {
        method: 'DELETE',
        body: { sha: currentPost.sha },
      });
      status('Deleted.', 'ok');
      renderBlogs();
    } catch (e: any) { status(e.message, 'err'); }
  };
}

async function saveBlog() {
  const form = $('blog-form');
  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-f]');
  const title = fields[0].value.trim();
  const pubDate = fields[1].value.trim();
  const description = fields[2].value.trim();
  const tags = (fields[3]?.value ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  const body = fields[4].value.trim();
  if (!title || !body) throw new Error('Title and body are required.');
  const slug = currentPost?.name ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.md';
  const front = [
    '---',
    `title: "${title}"`,
    `pubDate: ${pubDate || new Date().toISOString().slice(0, 10)}`,
    description ? `description: "${description}"` : '',
    `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
    '---',
    '',
    body + '\n',
  ].filter((l) => l !== '').join('\n');
  const r = await api('/blog/' + encodeURIComponent(slug), {
    method: 'PUT',
    body: { content: front, sha: currentPost?.sha ?? null },
  });
  currentPost = r;
  return `Saved ${slug}. Changes go live after the site rebuilds (~2 min).`;
}

/* ---------- Save ---------- */

$('save').onclick = async () => {
  $('save').disabled = true;
  try {
    const msg = section === 'blogs' ? await saveBlog() : (await api('/data/' + section, { method: 'PUT', body: data[section] })).message;
    status(msg, 'ok');
  } catch (e: any) { status(e.message, 'err'); }
  $('save').disabled = false;
};

checkAuth();
