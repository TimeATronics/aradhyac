---
title: "A color-sorting tower game in three.js"
pubDate: 2025-12-20
description: "A simple implementation of those clickbaity tower sort games ¬_¬"
tags: ["games", "webgl"]
---
Ever since LLMs started being popularly used for coding, there has been a huge onslaught of slop games, on top of the ever-present clickbaity games for mobile phones...

The tower game on this site started as a way to learn three.js. It is a color-sorting puzzle with eight colors of four disks each start shuffled across the towers, and you move stacks around until every tower holds a single color.

There is logic for "legal" and "illegal" move detection, along with a hint mechanism. And there is a special single-slot peg that unlocks only when the game detects you are at a deadlock. As for sound, there are only sound effects created by WebAudio oscillators.

I played it a lot while building it. I still lose more often than I win.
