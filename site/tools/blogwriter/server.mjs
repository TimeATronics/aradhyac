import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(HERE, '../../src/content/blog');
const ROOT = resolve(HERE, '../../..');
const PORT = Number(process.env.PORT || 4310);

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';

const readPosts = () =>
  readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const body = readFileSync(join(BLOG_DIR, f), 'utf8');
      const fm = body.match(/^---\n([\s\S]*?)\n---\n/);
      const meta = {};
      if (fm) {
        for (const line of fm[1].split('\n')) {
          const m = line.match(/^(\w+):\s*(.+)$/);
          if (m) meta[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
        }
      }
      return { slug: f.slice(0, -3), title: meta.title ?? f, pubDate: meta.pubDate ?? '', description: meta.description ?? '' };
    })
    .sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

const readBody = (slug) => {
  const f = join(BLOG_DIR, slug + '.md');
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};

const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

createServer(async (req, res) => {
  const [path] = req.url.split('?');

  if (req.method === 'GET' && path === '/api/posts') return json(res, 200, readPosts());

  if (req.method === 'GET' && path === '/api/post') {
    const slug = new URL(req.url, 'http://x').searchParams.get('slug');
    return json(res, 200, { slug, body: readBody(slug) });
  }

  if (req.method === 'POST' && path === '/api/post') {
    const { slug, title, pubDate, description, tags, body } = await new Promise((ok) => {
      let d = '';
      req.on('data', (c) => (d += c));
      req.on('end', () => ok(JSON.parse(d)));
    });
    const front = ['---', `title: "${title}"`, `pubDate: ${pubDate}`, `description: "${description}"`, `tags: [${(tags ?? []).map((t) => `"${t}"`).join(', ')}]`, '---', ''].join('\n');
    writeFileSync(join(BLOG_DIR, slug + '.md'), front + body);
    return json(res, 200, { ok: true, slug });
  }

  if (req.method === 'POST' && path === '/api/publish') {
    const { title, slug } = await new Promise((ok) => {
      let d = '';
      req.on('data', (c) => (d += c));
      req.on('end', () => ok(JSON.parse(d)));
    });
    try {
      const changed = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT }).toString().trim();
      if (!changed) return json(res, 200, { ok: true, pushed: false, message: 'Nothing to publish.' });
      execFileSync('git', ['add', 'site/src/content/blog'], { cwd: ROOT });
      execFileSync('git', ['commit', '-m', `blog: ${title}`], { cwd: ROOT });
      execFileSync('git', ['push'], { cwd: ROOT });
      return json(res, 200, { ok: true, pushed: true, message: `Published "${title}". Deploy runs in CI.` });
    } catch (e) {
      return json(res, 500, { ok: false, message: String(e.stderr || e.message) });
    }
  }

  // static assets
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (file === 'marked.min.js') {
    const candidates = ['node_modules/marked/marked.min.js', 'node_modules/marked/lib/marked.umd.js', 'node_modules/marked/marked.umd.js'];
    const src = candidates.find((c) => existsSync(join(HERE, '../..', c)));
    if (!src) return json(res, 500, { ok: false, message: 'marked not found - run npm install in site/' });
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    return res.end(readFileSync(join(HERE, '../..', src)));
  }
  if (!existsSync(join(HERE, 'public', file))) return json(res, 404, { ok: false });
  res.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' });
  res.end(readFileSync(join(HERE, 'public', file)));
}).listen(PORT, () => console.log(`blogwriter on http://localhost:${PORT}`));
