/* Barebones, hardened sessions store: one JSON file, full-map GET/POST.
   No shell, no exec, no dynamic paths - only a fixed JSON file is ever read
   or written. Input is strictly validated; requests are rate-limited. */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const FILE = process.env.SESSIONS_FILE || "/data/sessions.json";
const PORT = Number(process.env.PORT || 8080);

const MAX_BODY = 4 * 1024 * 1024; // hard cap on request body
const MAX_SESSIONS = 300; // cap on stored sessions
const MAX_ITEMS = 5000; // cap on progress/starred array length per session
const MAX_ID_LEN = 64;

const NAME_RE = /^[a-zA-Z0-9 _.-]{1,24}$/;
const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
const BAD_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__",
]);

// per-IP sliding-window rate limit (Caddy is the only front-end and sets X-Forwarded-For)
const WINDOW_MS = 60_000;
const RATE_MAX = 120;
const hits = new Map();

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "?";
}

function allowed(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length <= RATE_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    if (arr[arr.length - 1] < now - WINDOW_MS) hits.delete(ip);
  }
}, WINDOW_MS).unref();

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data));
}

function validate(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("expected an object");
  }
  const keys = Object.keys(data);
  if (keys.length > MAX_SESSIONS) throw new Error("too many sessions");
  for (const k of keys) {
    if (BAD_KEYS.has(k) || !NAME_RE.test(k)) throw new Error(`invalid session name`);
    const v = data[k];
    if (!v || typeof v !== "object" || Array.isArray(v) || v.session_name !== k) {
      throw new Error("bad session");
    }
    for (const arr of [v.progress, v.starred]) {
      if (!Array.isArray(arr) || arr.length > MAX_ITEMS) throw new Error("bad array");
      for (const id of arr) {
        if (typeof id !== "string" || id.length > MAX_ID_LEN || !ID_RE.test(id)) throw new Error("bad item");
      }
    }
  }
  return true;
}

createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const url = new URL(req.url, "http://x");
  if (url.pathname !== "/api/sessions") {
    res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "not found" }));
    return;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    res.writeHead(405).end();
    return;
  }
  if (!allowed(clientIp(req))) {
    res.writeHead(429, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "too many requests" }));
    return;
  }
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(load()));
    return;
  }
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (!ct.includes("application/json")) {
    res.writeHead(415).end();
    return;
  }
  let body = "";
  try {
    for await (const chunk of req) {
      body += chunk;
      if (body.length > MAX_BODY) throw Object.assign(new Error("too large"), { status: 413 });
    }
  } catch (e) {
    res.writeHead(e.status || 400).end();
    return;
  }
  try {
    const data = JSON.parse(body || "null");
    validate(data);
    save(data);
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: String(e.message) }));
  }
}).listen(PORT, () => {
  console.log(`sessions store on :${PORT} -> ${FILE}`);
});
