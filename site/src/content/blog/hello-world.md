---
title: "Hello, world"
pubDate: 2026-08-01
description: "The new site is a static site now — no React, no database, just Markdown and a build step."
tags: ["meta"]
---

This is the first post on the rebuilt site. It is generated from a plain Markdown file
at build time — writing a post means adding a file and pushing it to the repo.

What changed:

- **No React** on content pages; zero JavaScript ships for normal browsing.
- **No database** — everything lives in git, so GitHub is the backup.
- **No manual deploys** — a push triggers the build and ships the site.

The two interactive pages ([Zetla](/zetla) and the [tower game](/tower)) are kept as
self-contained islands; only they load JavaScript.
