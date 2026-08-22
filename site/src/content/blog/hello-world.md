---
title: "Hello, world"
pubDate: 2026-08-01
description: "The new site is a static site now, built with Astro. No React, no database, no manual deploys."
tags: ["meta"]
---

The rebuilt site is finally up. I had been running this thing on React, a Flask backend, and a MySQL database, which is a lot of machinery for a personal page that mostly shows text. Most of that is gone now.

The site is built with Astro and deployed as plain HTML. There is no database, no admin panel, no build step on the server. A push to the repo builds the site and ships it, and the whole thing runs from one small container.

The two interactive bits survived the rewrite. Zetla's landing page and the tower game are still here, as self-contained pages that only load JavaScript when you visit them. Everything else is just text.

I am still finding my way around the new setup, so expect small changes here and there.
