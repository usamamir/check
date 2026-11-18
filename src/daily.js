import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStore } from "./store.js";
import { runPass } from "./pipeline.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = openStore(process.env.DAYBOOK_DATA || path.join(root, "data"));

try {
  const state = await runPass(store);
  const run = state.lastRun;
  console.log(`Daybook ${run.at}`);
  console.log(`${run.kept} matches in the last ${run.windowDays} days, ${run.added} new, ${run.drafted} drafts.`);
  for (const source of run.sources || []) {
    console.log(`- ${source.name}: ${source.error || source.count}`);
  }
  if (state.profile.sample) {
    console.log("Profile is still the starter brief. Paste a resume in the app before relying on the letters.");
  }
  const hardFail = (run.sources || []).length > 0 && run.sources.every((source) => source.error) && run.kept === 0;
  process.exit(hardFail ? 1 : 0);
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
