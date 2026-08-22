# aradhyac

Personal site for aradhyac.com. Static Astro site, deployed by git push.

## Layout

- `site/` - the Astro site (pages, content, data, editor UI, small tools)
- `deploy/` - Docker Compose + Caddyfile for the VPS
- `.github/workflows/deploy.yml` - builds and ships the site on push to `main`

## Deploy

Push to `main`. GitHub Actions builds `site/`, rsyncs to the VPS, and restarts
the Caddy + editor containers. Nothing builds on the server.

## Local dev

```bash
cd site && npm install && npm run dev:all   # site on :4321, editor API on :8080
```

## Editing content

Visit `/edit` on the live site (GitHub OAuth) or run `npm run blog` locally to
write posts. All edits are git commits that redeploy the site.
