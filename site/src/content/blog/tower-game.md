---
title: "Zetla is out"
pubDate: 2026-07-15
description: "A local-first BYOK AI chat app for Android"
tags: ["android", "ai"]
---
Zetla is my Android AI chat app, and it is out now. Yes, it is Yet Another AI-LLM-GenAI-(insert your Jargon) app for android; but it is mine :) I just wanted an alternative to the Gemini App on my phone (which has somehow started degrading in quality since my yearly Google AI Pro subscription ended and I decided not to renew it).

The idea was to have a simple, cross-platform C++ library which I could use for LLM calls, Agentic Tool Calling, etc. for different use cases (I have used LangGraph extensively before via Python but I could not finding anything of the sort on C++ as such). Hence, the core zetla library came to be.

As such I support various OpenAI-compatible providers: DeepSeek, NVIDIA NIM, and OpenCode Zen. Adding more is trivial.

With time, I added multiple features like voice input (and output) via Vosk (I found it to be pretty good for its size). It can search the web and read pages through an Exa MCP tool. I also cross-compiled a static CPython distribution (one binary + stdlib zip) so for more technical questions where feasible, it can be used to run code on your phone inside a secure sandbox itself.

The [landing page](https://aradhyac.com/zetla) has the full feature list, screenshots, and APK links. If you try it, I would like to hear your thoughts.
