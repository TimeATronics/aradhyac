---
title: "A color-sorting tower game in three.js"
pubDate: 2026-06-20
description: "Eight towers, eight colors, two auxiliary pegs, and one stubborn single-slot peg."
tags: ["games", "webgl"]
---

The [tower game](/tower) is a color-sorting puzzle rendered in three.js. Eight colors
of four disks each are shuffled across the towers; move contiguous same-colored groups
onto empty pegs or matching stacks until every tower holds a single color.

Mechanics that made it fun to build:

- A special single-slot peg that unlocks when the solver detects a near-deadlock
- Contiguous-group selection instead of one-disk moves, which opens up strategy
- WebAudio synthesis for sound effects - no audio files shipped

It is fully client-side: one self-contained component, no assets, no server.
