import { createServer as createHttpServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStore } from "./store.js";
import { handleWeb } from "./http.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(root, "public");
const PAGE = path.join(root, "src", "index.html");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

async function toWebRequest(req) {
  const host = req.headers.host || "127.0.0.1";
  const url = new URL(req.url || "/", `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else if (value != null) headers.set(key, String(value));
  }
  if (req.method === "GET" || req.method === "HEAD") return new Request(url, { method: req.method, headers });
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return new Request(url, { method: req.method, headers, body: Buffer.concat(chunks) });
}

export function createServer({
  dataDir = path.join(root, "data"),
  searchImpl,
  pagePath = PAGE,
  publicDir = PUBLIC_DIR,
  allowQuit = false,
} = {}) {
  const store = openStore(dataDir);
  const publicRoot = path.resolve(publicDir);
  function resolveFile(urlPath) {
    if (urlPath === "/" || urlPath === "/index.html") return pagePath;
    let requested = "";
    try {
      requested = decodeURIComponent(urlPath).replace(/^\/+/, "");
    } catch {
      return null;
    }
    if (!requested || requested.includes("\0")) return null;
    const full = path.resolve(publicRoot, requested);
    if (full !== publicRoot && !full.startsWith(`${publicRoot}${path.sep}`)) return null;
    return full;
  }
  const server = createHttpServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const remote = req.socket.remoteAddress || "";
      const local = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1";
      if (allowQuit && local && req.method === "GET" && url.pathname === "/api/desktop") {
        res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ desktop: true }));
        return;
      }
      if (allowQuit && local && req.method === "POST" && url.pathname === "/api/quit") {
        res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ ok: true }));
        setTimeout(() => process.exit(0), 150);
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        const response = await handleWeb(await toWebRequest(req), { store, searchImpl });
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        res.writeHead(response.status, headers);
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ error: "Not found." }));
        return;
      }
      const file = resolveFile(url.pathname);
      let stat;
      try {
        stat = statSync(file || "");
      } catch {
        stat = null;
      }
      if (!file || !stat?.isFile() || !TYPES[path.extname(file)]) {
        res.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ error: "Not found." }));
        return;
      }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)], "cache-control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : readFileSync(file));
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ error: "Something went wrong." }));
      }
      console.error(error);
    }
  });
  return { server, store };
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const selfPath = fileURLToPath(import.meta.url);
const isMain = invoked === selfPath && path.basename(selfPath) === "server.js";
if (isMain) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  const { server } = createServer();
  server.listen(port, host, () => {
    console.log(`Daybook is at http://${host}:${port}`);
  });
}
