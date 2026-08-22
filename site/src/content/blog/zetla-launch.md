---
title: "Zetla is out"
pubDate: 2026-07-15
description: "A local-first AI chat app for Android, bring your own API key."
tags: ["android", "ai"]
---

Zetla is my Android AI chat app, and it is out now. The idea was to make an AI assistant that does not route everything through someone else's subscription. You bring your own API key, from DeepSeek, NVIDIA NIM, or OpenCode Zen, and the app talks to that provider directly. No vendor lock-in, no extra layer.

It has a few tricks that took most of the work. Voice input runs offline through Vosk, so you can talk to it without a connection. It can search the web and read pages through an Exa MCP tool, which makes it useful for planning and fact checking. And it has a bundled CPython sandbox, so the model can run code on your phone instead of in a cloud sandbox.

The landing page has the full feature list, theme screenshots, and APK links. If you try it, I would like to hear what breaks.
