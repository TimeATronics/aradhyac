---
title: "A Mupen64Plus Frontend for TrimUI Brick"
pubDate: 2026-08-29
description: "There wasn't one already, I guess..."
tags: ["projects", "games"]
---
I spent yesterday building a custom Mupen64Plus frontend for the TrimUI Brick, and it ended up being way more interesting (and tricky) than I expected. 

The Brick is a fantastic little Linux handheld, but its stock N64 setup uses a RetroArch core that performance-wise leaves a lot on the table. While digging around, I realized standalone Mupen64 binaries with different video plugins ran *much* better. The catch? No in-game menus, no easy save state management, no input remapping, and zero per-game settings.

So, I built **N64UI** (with loads of help from Deepseek v4 Flash!).

It’s written in C++ using SDL2 and embeds Mupen64Plus directly as a library. The biggest headache was getting the in-game menu working: because the video plugin owns the OpenGL context, the menu has to draw directly from the emulation thread's swap callback while the core is paused.

That sounds simple on paper, until you get to the Brick’s Mali GPU drivers. The driver is aggressively picky. Any GL state left modified by the menu completely corrupts the next rendered frame of the game. I had to write a full save-and-restore pass for every single GL state the menu touches (vertex attribute arrays included), which took embarrassingly long to debug.

A few other quirks worth remembering from the build:

* **Trigger handling:** The device's L2/R2 triggers report as analog axes that rest at `-32768` and max out at `+32767`. I had to update input capture to detect pushes by relative delta rather than zero-crossings.
* **Controller auto-config:** Mupen's input plugin has a "fully automatic" mode that silently overwrites custom bindings with auto-config defaults on every boot. Switching to explicit manual mode was non-negotiable.
* **Per-game config issues:** Overriding settings per game is handled via INI sections keyed by ROM MD5 hash. However, you have to snapshot global defaults before applying game-specific tweaks, or the current session's edits end up bleeding into every subsequent game you launch.

It’s finally reached the point where I stopped tweaking the code and just started playing games.

If you have a Brick and want to try it out, check out the project on [GitHub](https://github.com/TimeATronics/n64ui).
