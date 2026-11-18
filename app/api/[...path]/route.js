import { getIdentity } from "../../../cursor/identity.js";
import { handleWeb } from "../../../src/http.js";
import { openStore } from "../../../src/store.js";
import { openPgStore } from "../../../src/pg-store.js";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dataDir = path.join(process.cwd(), "data");

async function respond(request) {
  const identity = await getIdentity(request);
  if (!identity.verified || identity.kind !== "person") {
    return Response.json(
      { error: "Sign in to Daybook to keep a resume on this desk." },
      { status: 401, headers: { "cache-control": "private, no-store" } },
    );
  }
  const database = process.env.DATABASE_URL?.trim() ?? "";
  const store = !identity.simulated && database !== ""
    ? openPgStore(`${identity.stage === "preview" ? "preview" : "production"}:${identity.sub}`)
    : openStore(dataDir);
  return handleWeb(request, { store });
}

export const GET = respond;
export const POST = respond;
export const PATCH = respond;
