/**
 * Launch production renderer via app:// and dump load/console errors.
 * Usage: ELECTRON_RUN_AS_NODE= npx electron scripts/debug-blank.mjs
 */
import { app, BrowserWindow, protocol } from 'electron'
import { join, resolve, relative, extname, isAbsolute } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { is } = require('@electron-toolkit/utils')

const PROTOCOL = 'app'
const HOST = 'forge'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rendererRoot = resolve(__dirname, '../out/renderer')
const outDir = resolve(__dirname, '../.cache/debug-blank')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

const logs = []
function log(...args) {
  const line = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
  logs.push(line)
  console.log(line)
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: false
    }
  }
])

app.whenReady().then(async () => {
  await mkdir(outDir, { recursive: true })
  log('is.dev=', is.dev, 'isPackaged=', app.isPackaged, 'rendererRoot=', rendererRoot)

  protocol.handle(PROTOCOL, async (request) => {
    try {
      const url = new URL(request.url)
      let pathname = decodeURIComponent(url.pathname)
      if (!pathname || pathname === '/') pathname = '/index.html'
      const relativePath = pathname.replace(/^[/\\]+/, '')
      const resolved = resolve(rendererRoot, relativePath)
      const rel = relative(rendererRoot, resolved)
      const safe = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
      log('PROTO', request.url, '->', resolved, 'safe=', safe)
      if (!safe) {
        return new Response('Forbidden', { status: 403 })
      }
      const data = await readFile(resolved)
      const ext = extname(resolved).toLowerCase()
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
      log('SERVE', relativePath, contentType, data.byteLength)
      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': `${PROTOCOL}://${HOST}`
        }
      })
    } catch (err) {
      log('PROTO ERR', request.url, String(err))
      return new Response('Not Found', { status: 404 })
    }
  })

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    webPreferences: {
      preload: join(__dirname, '../out/preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    log('CONSOLE', { level, message, line, sourceId })
  })
  win.webContents.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    log('FAIL', { code, desc, url, isMainFrame })
  })
  win.webContents.on('did-finish-load', () => log('did-finish-load', win.webContents.getURL()))
  win.webContents.on('dom-ready', () => log('dom-ready', win.webContents.getURL()))
  win.webContents.on('preload-error', (_e, path, err) => log('PRELOAD ERR', path, String(err)))

  await win.loadURL(`${PROTOCOL}://${HOST}/index.html`)

  // Wait for React / DB bootstrap
  await new Promise((r) => setTimeout(r, 4000))

  const info = await win.webContents.executeJavaScript(`({
    href: location.href,
    readyState: document.readyState,
    rootHTML: document.getElementById('root')?.innerHTML?.slice(0, 500) ?? null,
    bodyText: document.body?.innerText?.slice(0, 500) ?? null,
    scripts: [...document.scripts].map(s => ({src: s.src, type: s.type})),
    errors: window.__forgeErrors || null
  })`)
  log('DOM', info)

  const image = await win.webContents.capturePage()
  await writeFile(join(outDir, 'screenshot.png'), image.toPNG())
  await writeFile(join(outDir, 'logs.txt'), logs.join('\n'))
  log('wrote', join(outDir, 'screenshot.png'))

  app.exit(0)
})
