#!/usr/bin/env node
/**
 * Build a Windows installer (.exe) for SupplyScout.
 * Bundles: Electron shell + Next standalone server + official Node win-x64 + better-sqlite3 win prebuild.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
import { createWriteStream } from "fs";
import * as tar from "tar";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const NODE_VERSION = "22.14.0";
const BSQL_VERSION = "12.11.1";
// Node 22 ABI
const NODE_ABI = "127";

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, ...opts });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function exists(p) {
  return fs.existsSync(p);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url}`);
    const file = createWriteStream(dest);
    const get = (u) => {
      https
        .get(u, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            get(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${u}`));
            res.resume();
            return;
          }
          res.pipe(file);
          file.on("finish", () => file.close(() => resolve(dest)));
        })
        .on("error", reject);
    };
    get(url);
  });
}

async function extractZip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  run(`python3 -c "import zipfile; zipfile.ZipFile(r'''${zipPath}''').extractall(r'''${destDir}''')"`);
}

console.log("=== SupplyScout Windows build ===");

// 1) Next standalone
run("npx next build");

const standalone = path.join(root, ".next", "standalone");
if (!exists(standalone)) throw new Error("Missing .next/standalone");

const staticSrc = path.join(root, ".next", "static");
if (exists(staticSrc)) copyDir(staticSrc, path.join(standalone, ".next", "static"));
const publicSrc = path.join(root, "public");
if (exists(publicSrc)) copyDir(publicSrc, path.join(standalone, "public"));
fs.mkdirSync(path.join(standalone, "data"), { recursive: true });
fs.writeFileSync(path.join(standalone, "data", ".gitkeep"), "");

// 2) Download official Node.js Windows binary (server runtime)
const cacheDir = path.join(root, ".cache-win");
fs.mkdirSync(cacheDir, { recursive: true });
const nodeZip = path.join(cacheDir, `node-v${NODE_VERSION}-win-x64.zip`);
const nodeDir = path.join(cacheDir, `node-v${NODE_VERSION}-win-x64`);
if (!exists(path.join(nodeDir, "node.exe"))) {
  const nodeUrl = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;
  await download(nodeUrl, nodeZip);
  await extractZip(nodeZip, cacheDir);
}
const nodeResourceDir = path.join(root, "electron-resources", "node");
fs.rmSync(nodeResourceDir, { recursive: true, force: true });
fs.mkdirSync(nodeResourceDir, { recursive: true });
fs.copyFileSync(path.join(nodeDir, "node.exe"), path.join(nodeResourceDir, "node.exe"));
console.log("Bundled node.exe for Windows server process");

// 3) better-sqlite3 win32 prebuild for Node ABI (not Electron)
const bsqlTgz = path.join(
  cacheDir,
  `better-sqlite3-v${BSQL_VERSION}-node-v${NODE_ABI}-win32-x64.tar.gz`
);
const bsqlUrl = `https://github.com/WiseLibs/better-sqlite3/releases/download/v${BSQL_VERSION}/better-sqlite3-v${BSQL_VERSION}-node-v${NODE_ABI}-win32-x64.tar.gz`;
if (!exists(bsqlTgz)) {
  await download(bsqlUrl, bsqlTgz);
}

const bsqlExtract = path.join(cacheDir, "bsql-win");
fs.rmSync(bsqlExtract, { recursive: true, force: true });
fs.mkdirSync(bsqlExtract, { recursive: true });
await tar.x({ file: bsqlTgz, cwd: bsqlExtract });

// Copy package into standalone, then overwrite binding with Windows .node
const srcBsql = path.join(root, "node_modules", "better-sqlite3");
const destBsql = path.join(standalone, "node_modules", "better-sqlite3");
fs.rmSync(destBsql, { recursive: true, force: true });
copyDir(srcBsql, destBsql);

// prebuild extracts to build/Release/better_sqlite3.node typically
const extractedNode =
  [
    path.join(bsqlExtract, "build", "Release", "better_sqlite3.node"),
    path.join(bsqlExtract, "Release", "better_sqlite3.node"),
    path.join(bsqlExtract, "better_sqlite3.node"),
  ].find((p) => exists(p)) || null;

if (!extractedNode) {
  console.error("Extracted tree:", execSync(`find ${bsqlExtract} -type f | head`, { encoding: "utf8" }));
  throw new Error("Could not find better_sqlite3.node in Windows prebuild");
}

const destBinding = path.join(destBsql, "build", "Release", "better_sqlite3.node");
fs.mkdirSync(path.dirname(destBinding), { recursive: true });
fs.copyFileSync(extractedNode, destBinding);
console.log("Installed Windows better-sqlite3 binding");

// Also keep bindings package happy if present
const bindingsDest = path.join(destBsql, "build", "better_sqlite3.node");
fs.copyFileSync(extractedNode, bindingsDest);

// 4) electron-builder packages the win-unpacked app (zip target avoids Wine NSIS issues)
fs.mkdirSync(path.join(root, "release"), { recursive: true });
fs.mkdirSync(path.join(root, "electron", "assets"), { recursive: true });

run("npx electron-builder --win zip --x64 --config electron-builder.yml", {
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: "false",
    ELECTRON_BUILDER_CACHE: path.join(root, ".cache-win", "electron-builder"),
  },
});

// 5) Native Linux makensis builds a real Windows Setup .exe from win-unpacked
const nsi = path.join(root, "scripts", "supplyscout-installer.nsi");
if (!exists(nsi)) throw new Error("Missing scripts/supplyscout-installer.nsi");
try {
  run(`makensis ${JSON.stringify(nsi)}`);
} catch (err) {
  console.warn(
    "makensis failed — install NSIS (`sudo apt-get install nsis`) to produce SupplyScout-Setup-*.exe"
  );
  console.warn(err instanceof Error ? err.message : err);
}

console.log("\n=== Done ===");
const releaseDir = path.join(root, "release");
for (const f of fs.readdirSync(releaseDir)) {
  if (/\.(exe|zip)$/i.test(f)) {
    const full = path.join(releaseDir, f);
    const mb = (fs.statSync(full).size / (1024 * 1024)).toFixed(1);
    console.log(` - ${f} (${mb} MB)`);
  }
}
