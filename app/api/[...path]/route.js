import { getIdentity } from "../../../cursor/identity.js";
import { handleWeb, passAllowed } from "../../../src/http.js";
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
  let store;
  if (identity.simulated) {
    store = openStore(dataDir);
  } else if (database === "") {
    return Response.json(
      { error: "Daybook is not ready until its database is connected." },
      { status: 503, headers: { "cache-control": "private, no-store" } },
    );
  } else {
    const stage = identity.stage === "preview" ? "preview" : "production";
    store = openPgStore(`${stage}:${identity.sub}`);
  }
  if (request.method === "POST" && new URL(request.url).pathname === "/api/pass") {
    const state = await store.load();
    const decision = passAllowed(state);
    if (!decision.ok) {
      return Response.json(
        { error: decision.error },
        { status: 429, headers: { "cache-control": "private, no-store" } },
      );
    }
    state.passLog = decision.log;
    await store.save(state);
  }
  return handleWeb(request, { store });
}

export const GET = respond;
export const POST = respond;
export const PATCH = respond;
