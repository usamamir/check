import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const html = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/index.html"));

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
    },
  });
}
