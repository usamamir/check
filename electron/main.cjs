const { app, BrowserWindow, shell, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

const PORT = Number(process.env.SUPPLYSCOUT_PORT || 3847);

let mainWindow = null;
let serverProcess = null;

function dataDir() {
  const dir = path.join(app.getPath("userData"), "data");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function serverRoot() {
  if (!app.isPackaged) {
    return path.join(__dirname, "..");
  }
  return path.join(process.resourcesPath, "server");
}

function nodeBinary() {
  if (!app.isPackaged) {
    return process.execPath; // use current node/electron for unpackaged testing
  }
  // Prefer bundled official Node for Windows native modules (better-sqlite3)
  const bundled = path.join(process.resourcesPath, "node", "node.exe");
  if (fs.existsSync(bundled)) return bundled;
  const bundledUnix = path.join(process.resourcesPath, "node", "node");
  if (fs.existsSync(bundledUnix)) return bundledUnix;
  // Fallback: Electron as Node
  return process.execPath;
}

function waitForServer(url, attempts = 90) {
  return new Promise((resolve, reject) => {
    let left = attempts;
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        left -= 1;
        if (left <= 0) reject(new Error("SupplyScout server failed to start"));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function startServer() {
  const root = serverRoot();
  const bin = nodeBinary();
  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: "127.0.0.1",
    SUPPLYSCOUT_DATA_DIR: dataDir(),
    NODE_ENV: "production",
  };

  // When falling back to Electron binary, run as Node
  if (bin === process.execPath && app.isPackaged) {
    env.ELECTRON_RUN_AS_NODE = "1";
  }

  const standaloneServer = path.join(root, "server.js");
  if (!fs.existsSync(standaloneServer)) {
    throw new Error(`Cannot find Next server at ${standaloneServer}`);
  }

  serverProcess = spawn(bin, [standaloneServer], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (buf) => {
    console.log(`[server] ${buf.toString().trim()}`);
  });
  serverProcess.stderr.on("data", (buf) => {
    console.error(`[server] ${buf.toString().trim()}`);
  });
  serverProcess.on("exit", (code) => {
    console.log(`[server] exited with ${code}`);
  });

  return waitForServer(`http://127.0.0.1:${PORT}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "SupplyScout",
    backgroundColor: "#0f1419",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const template = [
    {
      label: "SupplyScout",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function boot() {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      "SupplyScout failed to start",
      err instanceof Error ? err.message : String(err)
    );
    app.quit();
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot);

  app.on("window-all-closed", () => {
    if (serverProcess && !serverProcess.killed) serverProcess.kill();
    app.quit();
  });

  app.on("before-quit", () => {
    if (serverProcess && !serverProcess.killed) serverProcess.kill();
  });
}
