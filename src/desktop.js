import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "./server.js";
import pageFile from "./index.html" with { type: "file" };
import appFile from "../public/app.js" with { type: "file" };
import cssFile from "../public/styles.css" with { type: "file" };

const port = Number(process.env.PORT || 4173);

function writableHome() {
  const candidates = [process.env.DAYBOOK_HOME, process.env.APPDATA, process.env.USERPROFILE, process.env.HOME];
  for (const dir of candidates) {
    if (dir && !dir.includes("$bunfs")) return dir;
  }
  if (process.execPath && !String(process.execPath).includes("$bunfs")) return path.dirname(process.execPath);
  return process.platform === "win32" ? "C:\\Users\\Public" : "/tmp";
}

const home = writableHome();
const dataDir = path.join(home, "Daybook");
const uiDir = path.join(dataDir, "ui");

function showError(message) {
  try {
    mkdirSync(path.join(home, "Desktop"), { recursive: true });
    writeFileSync(path.join(home, "Desktop", "Daybook-error.txt"), message);
  } catch {
    try {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(path.join(dataDir, "error.txt"), message);
    } catch {
      // The console text is the backup.
    }
  }
  console.error(message);
  if (process.platform === "win32") {
    spawn(
      "powershell",
      ["-NoProfile", "-Command", "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show($env:DAYBOOK_ERROR, 'Daybook')"],
      { detached: true, windowsHide: false, env: { ...process.env, DAYBOOK_ERROR: message } },
    ).unref();
  }
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("rundll32", ["url.dll,FileProtocolHandler", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
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

try {
  mkdirSync(uiDir, { recursive: true });
  writeFileSync(path.join(uiDir, "index.html"), readFileSync(pageFile));
  writeFileSync(path.join(uiDir, "app.js"), readFileSync(appFile));
  writeFileSync(path.join(uiDir, "styles.css"), readFileSync(cssFile));

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
    showError(`Daybook could not start.\n\n${error.message}`);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log("Daybook is running. Leave this window open.");
    console.log(`If your browser did not open, go to http://127.0.0.1:${port}/`);
    if (!process.env.DAYBOOK_NO_OPEN) openBrowser(`http://127.0.0.1:${port}/`);
  });
} catch (error) {
  showError(`Daybook could not start.\n\n${error.stack || error.message}`);
  process.exit(1);
}
