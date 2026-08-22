const $ = (id) => document.getElementById(id);
let data = {};
let section = null;

const status = (msg, cls = '') => {
  const s = $('status');
  s.textContent = msg;
  s.className = cls;
};

const api = async (path, opts = {}) => {
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

const field = (label, value, placeholder = '', type = 'input') => `
  <label>${label}</label>
  <${type} data-f="1" placeholder="${placeholder}">${escapeHtml(value ?? '')}</${type}>`;

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let auth = null;
async function checkAuth() {
  try {
    auth = await api('/me', { method: 'GET' });
    if (auth.authed) {
      $('app').classList.remove('hidden');
      if (auth.user?.login) $('user-name').textContent = '@' + auth.user.login;
      load();
    } else {
      $('login').classList.remove('hidden');
      if (auth.oauthAuth) {
        $('gh-login').classList.remove('hidden');
      } else {
        $('login-err').textContent = 'GitHub login is not configured on this server.';
      }
    }
  } catch { $('login').classList.remove('hidden'); }
}

$('gh-login').onclick = () => { location.href = '/api/edit/oauth/start?return=' + (location.hash.slice(1) || 'projects'); };
$('logout').onclick = async () => { await api('/logout', { method: 'POST' }); location.reload(); };

async function load() {
  data = await api('/data', { method: 'GET' });
  section = location.hash.slice(1) || 'projects';
  render();
}

window.addEventListener('hashchange', () => { section = location.hash.slice(1) || 'projects'; render(); });

function render() {
  document.querySelectorAll('header nav a').forEach((a) => a.classList.toggle('active', a.hash.slice(1) === section));
  $('section-title').textContent = section.charAt(0).toUpperCase() + section.slice(1);
  $('save-bar').classList.remove('hidden');
  $('content').innerHTML = '';
  if (section === 'projects') renderProjects();
  else if (section === 'experience') renderExperience();
  else if (section === 'profile') renderProfile();
  else if (section === 'resources') renderResources();
  else if (section === 'publications') renderPublications();
  else if (section === 'music') renderMusic();
}

/* ---------- Projects ---------- */

let repos = [];
let reposShown = 15;

function renderProjects() {
  const c = $('content');
  c.innerHTML = `
    <div class="toolbar">
      <button id="gh-load">Load projects from GitHub</button>
      <span class="muted">check the ones you want to show, then edit their details</span>
    </div>
    <div id="gh-panel" class="hidden"></div>
    <div id="project-cards"></div>
    <button id="add-project">+ Add custom entry</button>`;

  $('gh-load').onclick = async () => {
    try {
      const r = await fetch('https://api.github.com/users/TimeATronics/repos?sort=updated&per_page=100');
      if (!r.ok) throw new Error(`GitHub API ${r.status}`);
      repos = await r.json();
      reposShown = 15;
      renderRepoPanel();
    } catch (e) { status('Failed to load repos: ' + e.message, 'err'); }
  };

  const renderRepoPanel = () => {
    const panel = $('gh-panel');
    panel.classList.remove('hidden');
    panel.innerHTML = `<div id="repo-list"></div><button id="gh-more" ${reposShown >= repos.length ? 'disabled' : ''}>Show more</button>
      <button id="gh-add" class="primary">Add selected</button>`;
    const list = $('repo-list');
    list.innerHTML = repos.slice(0, reposShown).map((r, i) => `
      <div class="repo-row">
        <input type="checkbox" value="${i}" />
        <span><a href="${r.html_url}" target="_blank" rel="noopener noreferrer">${r.name}</a></span>
        <span class="meta">${escapeHtml(r.description ?? '')}</span>
      </div>`).join('');
    $('gh-more').onclick = () => { reposShown += 15; renderRepoPanel(); };
    $('gh-add').onclick = () => {
      [...panel.querySelectorAll('input:checked')].forEach((cb) => {
        const r = repos[Number(cb.value)];
        data.projects.push({
          title: r.name,
          description: r.description ?? '',
          repo: r.html_url,
          link: '',
        });
      });
      renderProjects();
      status('Added. Edit details below, then Save.', 'ok');
    };
  };

  const list = $('project-cards');
  list.innerHTML = data.projects.map((p, i) => `
    <div class="card" data-i="${i}">
      <div class="card-head">
        <span class="muted">#${i + 1}</span>
        <button class="danger remove">Remove</button>
      </div>
      ${field('Title *', p.title, 'Project title')}
      ${field('Description *', p.description, 'Short description', 'textarea')}
      <div class="row">
        <div>${field('Repository link', p.repo, 'https://github.com/...')}</div>
        <div>${field('Live link', p.link, '/tower or https://...')}</div>
      </div>
    </div>`).join('');

  list.querySelectorAll('.card').forEach((card) => {
    const i = Number(card.dataset.i);
    card.querySelectorAll('[data-f]').forEach((el, k) => {
      const keys = ['title', 'description', 'repo', 'link'];
      el.oninput = () => { data.projects[i][keys[k]] = el.value; };
    });
    card.querySelector('.remove').onclick = () => {
      data.projects.splice(i, 1);
      renderProjects();
    };
  });

  $('add-project').onclick = () => {
    data.projects.push({ title: '', description: '', repo: '', link: '' });
    renderProjects();
  };
}

/* ---------- Experience ---------- */

function renderExperience() {
  const c = $('content');
  c.innerHTML = `<div id="exp-cards"></div><button id="add-exp">+ Add entry</button>`;
  const list = $('exp-cards');
  list.innerHTML = data.experience.map((e, i) => `
    <div class="card" data-i="${i}">
      <div class="card-head"><span class="muted">#${i + 1}</span><button class="danger remove">Remove</button></div>
      <div class="row">
        <div>${field('Position *', e.position)}</div>
        <div>${field('Organization *', e.organization)}</div>
      </div>
      ${field('Time period', e.period, 'Jan 2025 – Dec 2025')}
      ${field('Work done (one point per line)', e.points.join('\n'), '', 'textarea')}
    </div>`).join('');

  list.querySelectorAll('.card').forEach((card) => {
    const i = Number(card.dataset.i);
    card.querySelectorAll('[data-f]').forEach((el, k) => {
      if (k < 3) el.oninput = () => { data.experience[i][['position', 'organization', 'period'][k]] = el.value; };
      else el.oninput = () => { data.experience[i].points = el.value.split('\n').map((s) => s.trim()).filter(Boolean); };
    });
    card.querySelector('.remove').onclick = () => { data.experience.splice(i, 1); renderExperience(); };
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

  const renderLinks = () => {
    $('links').innerHTML = Object.entries(p.links).map(([k, v], i) => `
      <div class="row" style="margin-bottom:0.4rem">
        <div><input data-lk data-i="${i}" placeholder="Label (GitHub)" value="${escapeHtml(k)}" /></div>
        <div><input data-lv data-i="${i}" placeholder="URL" value="${escapeHtml(v)}" /></div>
        <button class="danger" data-rm="${i}">Remove</button>
      </div>`).join('');
    $('links').querySelectorAll('[data-lk]').forEach((el) => {
      el.oninput = () => { const i = el.dataset.i; const keys = Object.keys(p.links); const v = p.links[keys[i]]; delete p.links[keys[i]]; p.links[el.value] = v; };
    });
    $('links').querySelectorAll('[data-lv]').forEach((el) => {
      el.oninput = () => { p.links[Object.keys(p.links)[el.dataset.i]] = el.value; };
    });
    $('links').querySelectorAll('[data-rm]').forEach((el) => {
      el.onclick = () => { delete p.links[Object.keys(p.links)[el.dataset.rm]]; renderProfile(); };
    });
  };
  renderLinks();

  $('add-link').onclick = () => { p.links['New link'] = ''; renderLinks(); };

  c.querySelectorAll('main [data-f], #content > [data-f]').forEach((el, k) => {
    const keys = ['name', 'tagline', 'about'];
    if (k < 2) el.oninput = () => { p[keys[k]] = el.value; };
    else if (k === 2) el.oninput = () => { p.about = el.value.split('\n').map((s) => s.trim()).filter(Boolean); };
  });
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
    $('res-rows').innerHTML = data.resources.map((r, i) => `
      <tr data-i="${i}">
        <td><input data-f="0" value="${escapeHtml(r.subject)}" /></td>
        <td><input data-f="1" value="${escapeHtml(r.course_number)}" /></td>
        <td><input data-f="2" value="${escapeHtml(r.institution)}" /></td>
        <td><input data-f="3" value="${escapeHtml(r.url)}" /></td>
        <td><button class="danger remove">Remove</button></td>
      </tr>`).join('');
    $('res-rows').querySelectorAll('tr').forEach((tr) => {
      const i = Number(tr.dataset.i);
      tr.querySelectorAll('[data-f]').forEach((el) => {
        el.oninput = () => {
          const keys = ['subject', 'course_number', 'institution', 'url'];
          data.resources[i][keys[Number(el.dataset.f)]] = el.value;
        };
      });
      tr.querySelector('.remove').onclick = () => { data.resources.splice(i, 1); renderRows(); };
    });
  };
  renderRows();

  $('add-res').onclick = () => {
    data.resources.push({ subject: '', course_number: '', institution: '', url: '' });
    renderRows();
  };
}

/* ---------- Publications ---------- */

function renderPublications() {
  const c = $('content');
  c.innerHTML = `
    <div class="toolbar">
      <a href="https://orcid.org/0009-0003-3450-5728" target="_blank" rel="noopener noreferrer">ORCID profile</a>
    </div>
    <p class="muted">Publications are fetched from ORCID. Use Refresh to update the cache.</p>
    <div class="toolbar"><button id="pub-refresh" class="primary">Refresh from ORCID</button></div>
    <table>
      <thead><tr><th>Title</th><th>Venue</th><th>Year</th><th>Link</th></tr></thead>
      <tbody>
        ${data.publications.map((p) => `
          <tr><td>${escapeHtml(p.title)}</td><td>${escapeHtml(p.venue)}</td><td>${escapeHtml(p.year)}</td>
          <td><a href="${escapeHtml(p.url ?? `https://doi.org/${p.doi}`)}">doi</a></td></tr>`).join('')}
      </tbody>
    </table>`;
  $('pub-refresh').onclick = async () => {
    $('pub-refresh').disabled = true;
    try {
      const r = await api('/publications/refresh', { method: 'POST' });
      data.publications = r.publications;
      status(r.message, 'ok');
      renderPublications();
    } catch (e) { status(e.message, 'err'); }
    $('pub-refresh').disabled = false;
  };
}

/* ---------- Music ---------- */

function renderMusic() {
  const c = $('content');
  c.innerHTML = `<div id="music-rows"></div><button id="add-music">+ Add track</button>`;
  const renderRows = () => {
    $('music-rows').innerHTML = data.music.map((m, i) => `
      <div class="card" data-i="${i}">
        <div class="card-head"><span class="muted">#${i + 1}</span><button class="danger remove">Remove</button></div>
        ${field('Title *', m.title, 'Hedwig\'s Theme — searemind')}
        ${field('Bandcamp embed URL *', m.url, 'https://bandcamp.com/EmbeddedPlayer/track=...')}
      </div>`).join('');
    $('music-rows').querySelectorAll('.card').forEach((card) => {
      const i = Number(card.dataset.i);
      card.querySelectorAll('[data-f]').forEach((el, k) => {
        el.oninput = () => { data.music[i][['title', 'url'][k]] = el.value; };
      });
      card.querySelector('.remove').onclick = () => { data.music.splice(i, 1); renderRows(); };
    });
  };
  renderRows();
  $('add-music').onclick = () => { data.music.push({ title: '', url: '' }); renderRows(); };
}

/* ---------- Save ---------- */

$('save').onclick = async () => {
  if (section === 'publications') return status('Publications come from ORCID — nothing to save manually.');
  $('save').disabled = true;
  try {
    const r = await api('/data/' + section, { method: 'PUT', body: data[section] });
    status(r.message, 'ok');
  } catch (e) { status(e.message, 'err'); }
  $('save').disabled = false;
};

checkAuth();
