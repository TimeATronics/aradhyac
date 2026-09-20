---
title: "A Nintendo DS Styled Launcher for the TrimUI Brick"
pubDate: 2026-09-20
description: "3D models oooooh..."
tags: ["games", "dev"]
---
I spent the last few weeks building NDSUI, a Nintendo DS styled launcher for the TrimUI Brick, and it turned out to be a much deeper project than "make a prettier menu" (with loads of help from Deepseek v4 Flash, again).

The stock launcher works fine, but it doesn't feel like anything. The Brick is the perfect EDC handheld, so I wanted a launcher that leans into it with a background like the Nintendo DS, styled font, and every console presented as a 3D cartridge floating in the middle. Picking a game should feel like picking a cartridge off a shelf.

The biggest rabbit hole was that 3D carousel. The vendor GL driver on this thing is aggressively picky (the same driver that made my N64UI menu such a pain), so the cartridges are rasterized entirely in software: my own z-buffer, flat-shaded textured triangles, rendered into a plain SDL surface and composited by hand. Even then the driver had opinions. Partial texture uploads showed stale pixels and made the top bar flicker on every move, so the whole frame gets uploaded every time. The top bar also had to be drawn after any full background repaint, otherwise it blinks out for a frame on every page switch.

A few other quirks worth remembering:
- I deleted half the settings on purpose. I'd built display brightness, LED, volume and WiFi/Bluetooth screens... then tore them out. The stock OSD already owns all of that (MENU+SELECT), and fighting it meant the OSD stopped working inside the launcher. NDSUI now only manages its own theme; brightness, LEDs, sound and radios stay stock.
- Booting without replacing the launcher. Booting straight into NDSUI from the boot script silently killed the stock hotkeys, because they only work inside an "app session". The fix: a small script waits for MainUI to come up, queues NDSUI as the app to run, and lets MainUI exit before it renders. NDSUI boots as a normal app, so the OSD, the power button and the crash fallback to MainUI all keep working.
- Theme switching left a mess. Toggling light/dark left a mix of old and new grid lines on screen, because only damaged regions were repainting. Forcing a full repaint before the top bar fixed it - and taught me how the whole damage-tracking pipeline really worked.
- It's light. Idle it sits at ~10% of one core and 45 MB RAM, versus the stock launcher's 136 MB. The carousel is the expensive part; everything else is nearly free.
Each console comes from your own Emus/*/config.json, with era-correct models (cartridges for cart systems, discs for CD ones) derived from public GLB/STL models with a couple of small scripts, plus box art, Recently Played, Favorites and a DS-style search keyboard.
It's reached the point where I stopped fiddling and made it my daily launcher - it boots straight into NDSUI, and the stock OSD still handles every system toggle.

If you have a Brick and want to try it out, check out the project on [GitHub] (https://github.com/TimeATronics/ndsui) - there's a ready-to-drop zip in the repo.
