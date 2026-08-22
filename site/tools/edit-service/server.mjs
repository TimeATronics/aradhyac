import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);

// optional local-only env file (site/tools/edit-service/.env) — never committed, never deployed
try {
  for (const line of readFileSync(join(HERE, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {}

const GH_REPO = process.env.GH_REPO || 'TimeATronics/aradhyac';
const GH_PATH = process.env.GH_PATH || 'site/src/data';
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT = process.env.GITHUB_REDIRECT || 'https://aradhyac.com/api/edit/oauth/callback';
const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://aradhyac.com';

const DATA_FILES = ['projects', 'experience', 'profile', 'resources', 'music'];
const SESSION_TTL = 24 * 3600 * 1000;
const sessions = new Map();
const oauthStates = new Map();

const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

const readBody = (req) =>
  new Promise((ok, err) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => { try { ok(JSON.parse(d)); } catch { err(new Error('bad json')); } });
    req.on('error', err);
  });

const cookie = (req, name) => {
  const m = (req.headers.cookie ?? '').match(new RegExp(`${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
};

function authed(req) {
  const token = cookie(req, 'edit_auth');
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.exp) { sessions.delete(token); return null; }
  return s;
}

async function sessionToken(s) {
  if (s.ghToken && (!s.expiresAt || Date.now() < s.expiresAt)) return s.ghToken;
  if (s.refreshToken && CLIENT_ID && CLIENT_SECRET) {
    try {
      const r = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: s.refreshToken,
        }),
      }).then((r) => r.json());
      if (r.access_token) {
        s.ghToken = r.access_token;
        s.expiresAt = Date.now() + (r.expires_in ?? 8 * 3600) * 1000;
        if (r.refresh_token) s.refreshToken = r.refresh_token;
        return s.ghToken;
      }
    } catch {}
  }
  return s.ghToken;
}

const ghGet = async (path) => {
  const url = `https://raw.githubusercontent.com/${GH_REPO}/main/${GH_PATH}/${path}`;
  const res = await fetch(url);
  if (res.ok) return res.json();
  const local = join(HERE, '../../src/data', path);
  if (existsSync(local)) return JSON.parse(readFileSync(local, 'utf8'));
  throw new Error(`GH raw ${res.status}`);
};
const ghWritePath = async (token, path, content) => {
  if (!token) throw new Error('editor not configured (no GitHub token)');
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encoded}`;
  const existing = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const sha = existing.ok ? (await existing.json()).sha : undefined;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `edit: update ${path.split('/').pop()}`,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GH write ${res.status}: ${await res.text()}`);
  return res.json();
};

const ghWrite = (token, path, data) =>
  ghWritePath(token, `${GH_PATH}/${path}`, JSON.stringify(data, null, 2) + '\n');

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function validate(name, data) {
  if (name === 'projects') {
    if (!Array.isArray(data)) throw new Error('projects must be an array');
    return data.map((p, i) => {
      const title = str(p.title);
      const description = str(p.description);
      if (!title || !description) throw new Error(`Project ${i + 1}: title and description are required`);
      return { title, description, repo: str(p.repo), link: str(p.link) };
    });
  }
  if (name === 'experience') {
    if (!Array.isArray(data)) throw new Error('experience must be an array');
    return data.map((e, i) => {
      const position = str(e.position);
      const organization = str(e.organization);
      if (!position || !organization) throw new Error(`Experience ${i + 1}: position and organization are required`);
      return {
        position,
        organization,
        period: str(e.period),
        points: Array.isArray(e.points) ? e.points.map((p) => str(p)).filter(Boolean) : [],
      };
    });
  }
  if (name === 'profile') {
    if (!data || typeof data !== 'object') throw new Error('profile must be an object');
    if (!str(data.name)) throw new Error('profile: name is required');
    return {
      name: str(data.name),
      tagline: str(data.tagline),
      about: Array.isArray(data.about) ? data.about.map((p) => str(p)).filter(Boolean) : [],
      links: Object.fromEntries(
        Object.entries(data.links ?? {}).map(([k, v]) => [str(k), str(v)]).filter(([k]) => k),
      ),
    };
  }
  if (name === 'resources') {
    if (!Array.isArray(data)) throw new Error('resources must be an array');
    return data.map((r, i) => {
      const subject = str(r.subject);
      if (!subject) throw new Error(`Resource ${i + 1}: subject is required`);
      return { subject, course_number: str(r.course_number), institution: str(r.institution), url: str(r.url) };
    });
  }
  if (name === 'music') {
    if (!Array.isArray(data)) throw new Error('music must be an array');
    return data.map((m, i) => {
      const title = str(m.title);
      const url = str(m.url);
      if (!title || !url) throw new Error(`Track ${i + 1}: title and embed URL are required`);
      return { title, url };
    });
  }
  throw new Error(`unknown data file: ${name}`);
}
const orcidWorks = async () => {
  const res = await fetch('https://pub.orcid.org/v3.0/0009-0003-3450-5728/works', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`ORCID API ${res.status}`);
  const data = await res.json();
  return (data.group ?? []).map((g) => {
    const w = g['work-summary'][0];
    const ext = (w['external-ids']?.['external-id'] ?? [])[0] ?? {};
    return {
      title: w.title?.title?.value ?? '',
      type: w.type ?? '',
      year: w['publication-date']?.year?.value ?? '',
      venue: w['journal-title']?.value ?? '',
      doi: ext['external-id-type'] === 'doi' ? ext['external-id-value'] : null,
      url: w.url?.value ?? null,
    };
  });
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/api/edit/logout' && req.method === 'POST') {
      sessions.delete(cookie(req, 'edit_auth') ?? '');
      res.writeHead(200, { 'Set-Cookie': 'edit_auth=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      return res.end(JSON.stringify({ ok: true }));
    }

    if (path === '/api/edit/oauth/start') {
      if (!CLIENT_ID || !CLIENT_SECRET) return json(res, 400, { ok: false, message: 'GitHub OAuth is not configured.' });
      const state = randomUUID();
      oauthStates.set(state, { ret: url.searchParams.get('return') || 'projects', exp: Date.now() + 10 * 60 * 1000 });
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: GITHUB_REDIRECT,
        scope: 'public_repo',
        state,
      });
      res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
      return res.end();
    }

    if (path === '/api/edit/oauth/callback') {
      const state = url.searchParams.get('state');
      const st = oauthStates.get(state ?? '');
      if (!st || Date.now() > st.exp) return json(res, 400, { ok: false, message: 'OAuth state expired — try again.' });
      oauthStates.delete(state);
      const code = url.searchParams.get('code');
      if (!code) return json(res, 400, { ok: false, message: 'GitHub did not return a code.' });
      const tok = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      }).then((r) => r.json());
      if (!tok.access_token) return json(res, 400, { ok: false, message: 'OAuth exchange failed.' });
      let user = null;
      try {
        user = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${tok.access_token}` },
        }).then((r) => r.json());
        user = { login: user.login ?? null, name: user.name ?? null };
      } catch {}
      const token = randomUUID();
      sessions.set(token, {
        exp: Date.now() + SESSION_TTL,
        ghToken: tok.access_token,
        refreshToken: tok.refresh_token ?? null,
        expiresAt: Date.now() + (tok.expires_in ?? 8 * 3600) * 1000,
        user,
      });
      const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
      res.writeHead(302, {
        Location: `${SITE_ORIGIN}/edit#${st.ret}`,
        'Set-Cookie': `edit_auth=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL / 1000}${secure}`,
      });
      return res.end();
    }

    if (path === '/api/edit/me') {
      const s = authed(req);
      return json(res, 200, {
        authed: !!s,
        user: s?.user ?? null,
        oauthAuth: !!(CLIENT_ID && CLIENT_SECRET),
      });
    }

    if (path.startsWith('/edit')) {
      return json(res, 404, { ok: false, message: 'The editor UI is served by the site build (/edit).' });
    }

    const s = authed(req);
    if (!s) return json(res, 401, { ok: false, message: 'Not logged in.' });

    if (path === '/api/edit/data' && req.method === 'GET') {
      const out = {};
      for (const f of DATA_FILES) out[f] = await ghGet(`${f}.json`);
      out.publications = await ghGet('publications.cache.json');
      return json(res, 200, out);
    }

    if (path.startsWith('/api/edit/data/') && req.method === 'PUT') {
      const name = path.slice('/api/edit/data/'.length);
      if (!DATA_FILES.includes(name)) return json(res, 400, { ok: false, message: `unknown file: ${name}` });
      const data = await readBody(req);
      const cleaned = validate(name, data);
      const token = await sessionToken(s);
      await ghWrite(token, `${name}.json`, cleaned);
      return json(res, 200, { ok: true, message: `Saved ${name}. Changes go live after the site rebuilds (~2 min).` });
    }

    if (path === '/api/edit/blog' && req.method === 'GET') {
      const res2 = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/site/src/content/blog`, {
        headers: { Authorization: `Bearer ${await sessionToken(s)}` },
      });
      if (!res2.ok) throw new Error(`GH list ${res2.status}`);
      const files = await res2.json();
      return json(res, 200, (Array.isArray(files) ? files : []).filter((f) => f.type === 'file' && f.name.endsWith('.md')).map((f) => ({ name: f.name, sha: f.sha })));
    }

    if (path.startsWith('/api/edit/blog/') && req.method === 'GET') {
      const name = decodeURIComponent(path.slice('/api/edit/blog/'.length));
      const url = `https://api.github.com/repos/${GH_REPO}/contents/site/src/content/blog/${encodeURIComponent(name)}`;
      const res2 = await fetch(url, { headers: { Authorization: `Bearer ${await sessionToken(s)}` } });
      if (!res2.ok) throw new Error(`GH get ${res2.status}`);
      const f = await res2.json();
      return json(res, 200, { name: f.name, sha: f.sha, content: Buffer.from(f.content, 'base64').toString('utf8') });
    }

    if (path.startsWith('/api/edit/blog/') && req.method === 'PUT') {
      const name = decodeURIComponent(path.slice('/api/edit/blog/'.length));
      const { content, sha } = await readBody(req);
      if (!content || typeof content !== 'string') return json(res, 400, { ok: false, message: 'content is required' });
      const token = await sessionToken(s);
      const ghUrl = `https://api.github.com/repos/${GH_REPO}/contents/site/src/content/blog/${encodeURIComponent(name)}`;
      const res2 = await fetch(ghUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `blog: ${sha ? 'update' : 'create'} ${name}`,
          content: Buffer.from(content).toString('base64'),
          ...(sha ? { sha } : {}),
        }),
      });
      if (!res2.ok) throw new Error(`GH write ${res2.status}: ${await res2.text()}`);
      const f = await res2.json();
      return json(res, 200, { ok: true, name: f.content?.name ?? name, sha: f.content?.sha, message: `Saved ${name}. Changes go live after the site rebuilds (~2 min).` });
    }

    if (path.startsWith('/api/edit/blog/') && req.method === 'DELETE') {
      const name = decodeURIComponent(path.slice('/api/edit/blog/'.length));
      const { sha } = await readBody(req);
      const url = `https://api.github.com/repos/${GH_REPO}/contents/site/src/content/blog/${encodeURIComponent(name)}`;
      const res2 = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${await sessionToken(s)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `blog: delete ${name}`, sha }),
      });
      if (!res2.ok) throw new Error(`GH delete ${res2.status}: ${await res2.text()}`);
      return json(res, 200, { ok: true, message: `Deleted ${name}.` });
    }

    return json(res, 404, { ok: false });
  } catch (e) {
    return json(res, 500, { ok: false, message: String(e.message || e) });
  }
}).listen(PORT, () => console.log(`editor on :${PORT}`));
