---
title: "Hello, world"
pubDate: 2026-08-01
description: "How this site started with a Black Friday deal and ended up as a static Astro site on a single container."
tags: ["meta"]
---
Up until last September I had never given web development or hosting much thought. Then the Black Friday emails landed. GoDaddy had a cheap domain registration deal, and RackNerd was selling VPSes at a price that was hard to argue with. I bought both and set about learning how to put a website on a server.

The first version was more of a learning project. A React frontend, a Flask backend, a MySQL database, nginx and gunicorn all running on a 2.5 GB VPS. I deployed by hand, over SSH, with a shell script that pulled the code, rebuilt the frontend, and restarted the service. It worked, but it was also a lot of extra steps for even adding a blog entry, so I never found the energy to actually write there.

Then life happened, and I basically forgot about the site for a while.

Fast forward to now. The site is back, and I have redone things. It is built with Astro and served as plain HTML by Caddy. A push to the repo runs the build in CI (Github Actions) and deploys as well!

The whole thing lives in one small container, using around 150 MB of RAM instead of the 600 MB the old version used up. I also moved the domain from GoDaddy to Cloudflare, mostly because Cloudflare's dashboard is easier to live in (and no hidden costs!).

A few design principles I kept in mind while rebuilding:

- All of the content resides on GitHub.
- No Javascript wherever possible...
- Automated CI/CD

I am still finding my way around the new setup, so expect small changes here and there.
