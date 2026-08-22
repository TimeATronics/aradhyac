---
title: "Hello, world"
pubDate: 2026-08-01
description: "How this site started with a Black Friday deal and ended up as a static Astro site on a single container."
tags: ["meta"]
---
Up until last September I had never given web development or hosting much thought. Then the Black Friday emails landed. GoDaddy had a cheap domain registration deal, and RackNerd was selling VPSes at a price that was hard to argue with. I bought both and set about learning how to put a website on a server.

The first version was a proper learning project. A React frontend, a Flask backend, a MySQL database, nginx and gunicorn all running on a 2.5 GB VPS. I deployed by hand, over SSH, with a shell script that pulled the code, rebuilt the frontend, and restarted the service. It worked. It was also a lot of machinery for a page that mostly shows text, and most of that machinery only existed on the server, so I could not have rebuilt the box if it died.

Then life happened, and I basically forgot about the site for a while.

Fast forward to now. The site is back, rebuilt from scratch. The stack is smaller this time. It is built with Astro and served as plain HTML by Caddy, which sorts out TLS certificates on its own. There is no database, no admin panel, and no build step on the server. A push to the repo runs the build in CI and ships the result. The whole thing lives in one small container, using around 150 MB of RAM instead of the 600 MB the old stack wanted.

I also moved the domain from GoDaddy to Cloudflare, mostly because Cloudflare's dashboard is easier to live in (and no hidden costs!). The DNS records moved over without drama, which is the nicest thing you can say about DNS.

A few design principles I kept in mind while rebuilding:

- Content lives in git. Blogs and site data are files in the repo, so the repository is the backup, and GitHub keeps an offsite copy.
- Text first, JavaScript only where it earns its place. Two pages load any JavaScript at all: the Zetla landing page and the tower game. Everything else is static HTML.
- No database. Structured data is a handful of JSON files, edited through a small editor that commits to the repo.
- Deploy by push. No SSH sessions, no builds on the box. CI does the work and syncs the output.

I am still finding my way around the new setup, so expect small changes here and there.
