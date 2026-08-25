/* Barebones sessions store: one JSON file on disk, full-map GET/POST. */
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const FILE = process.env.SESSIONS_FILE || "/data/sessions.json";
const PORT = Number(process.env.PORT || 8080);
const MAX_BODY = 4 * 1024 * 1024;

function load() {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname !== "/api/sessions") {
    res.writeHead(404, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "not found" }));
    return;
  }
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(load()));
    return;
  }
  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > MAX_BODY) {
        res.writeHead(413).end(JSON.stringify({ error: "too large" }));
        return;
      }
    }
    try {
      const data = JSON.parse(body || "null");
      if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error("expected an object");
      for (const [k, v] of Object.entries(data)) {
        if (!v || typeof v !== "object" || v.session_name !== k) throw new Error(`bad session "${k}"`);
        if (!Array.isArray(v.progress) || !Array.isArray(v.starred)) throw new Error(`bad arrays in "${k}"`);
      }
      save(data);
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: String(e.message) }));
    }
    return;
  }
  res.writeHead(405).end();
}).listen(PORT, () => {
  console.log(`sessions store on :${PORT} -> ${FILE}`);
});
