---
title: "A color-sorting tower game in three.js"
pubDate: 2026-06-20
description: "Eight towers, eight colors, two auxiliary pegs, and one stubborn single-slot peg."
tags: ["games", "webgl"]
---

The tower game on this site started as a way to learn three.js and turned into something I kept coming back to. It is a color-sorting puzzle. Eight colors of four disks each start shuffled across the towers, and you move stacks around until every tower holds a single color.

Two details make it harder than it looks. You move contiguous groups of the same color, not single disks, which changes what a "safe" move is. And there is a special single-slot peg that unlocks only when the game detects you are close to a deadlock. It is the game quietly telling you to stop shuffling and think.

There are no audio files. Sound effects come from WebAudio oscillators, so the whole thing ships as one component with no assets and no server.

I played it a lot while building it. I still lose more often than I win.
