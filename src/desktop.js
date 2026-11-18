import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "./server.js";
import pageFile from "./index.html" with { type: "file" };
import appFile from "../public/app.js" with { type: "file" };
import cssFile from "../public/styles.css" with { type: "file" };

const port = Number(process.env.PORT || 4173);
const home = process.env.APPDATA || process.env.HOME || process.cwd();
const dataDir = path.join(home, "Daybook");
const uiDir = path.join(dataDir, "ui");

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
    return;
  }
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(command, [url], { detached: true, stdio: "ignore" }).unref();
}

async function alreadyRunning() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/desktop`, { signal: AbortSignal.timeout(800) });
    return response.ok;
  } catch {
    return false;
  }
}

mkdirSync(uiDir, { recursive: true });
copyFileSync(pageFile, path.join(uiDir, "index.html"));
copyFileSync(appFile, path.join(uiDir, "app.js"));
copyFileSync(cssFile, path.join(uiDir, "styles.css"));

if (await alreadyRunning()) {
  openBrowser(`http://127.0.0.1:${port}/`);
  process.exit(0);
}

const { server } = createServer({
  dataDir,
  pagePath: path.join(uiDir, "index.html"),
  publicDir: uiDir,
  allowQuit: true,
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    openBrowser(`http://127.0.0.1:${port}/`);
    process.exit(0);
  }
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  if (!process.env.DAYBOOK_NO_OPEN) openBrowser(`http://127.0.0.1:${port}/`);
});
