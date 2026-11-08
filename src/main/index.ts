import { app, shell, BrowserWindow, ipcMain, protocol, session } from 'electron'
import { join, resolve, relative, extname, isAbsolute } from 'path'
import { readFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const PROTOCOL = 'app'
const HOST = 'forge'

/** Production CSP — allows YouTube embeds + exercise image CDN origins only. */
const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://wger.de",
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  'child-src https://www.youtube-nocookie.com https://www.youtube.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ')

/** Dev CSP — Vite HMR needs inline scripts + websocket. */
const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:* https://wger.de",
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  'child-src https://www.youtube-nocookie.com https://www.youtube.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ')

/**
 * Chromium rejects <script type="module"> unless Content-Type is a JS MIME.
 * net.fetch(file://…) inside asar often omits/wrong-types this → blank window.
 */
const MIME_TYPES: Record<string, string> = {
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
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json'
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

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0A0A0B',
    title: 'FORGE',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[forge] did-fail-load ${errorCode} ${errorDescription} url=${validatedURL}`)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // Custom privileged origin so YouTube embeds work (avoids file:// Error 153)
    mainWindow.loadURL(`${PROTOCOL}://${HOST}/index.html`)
  }

  return mainWindow
}

function isPathInsideRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function registerAppProtocol(): void {
  const rendererRoot = resolve(__dirname, '../renderer')

  protocol.handle(PROTOCOL, async (request) => {
    try {
      const url = new URL(request.url)
      let pathname = decodeURIComponent(url.pathname)
      if (!pathname || pathname === '/') {
        pathname = '/index.html'
      }

      // Drop leading slashes so path.resolve never treats the segment as absolute
      const relativePath = pathname.replace(/^[/\\]+/, '')
      const resolved = resolve(rendererRoot, relativePath)

      if (!isPathInsideRoot(rendererRoot, resolved)) {
        return new Response('Forbidden', {
          status: 403,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }

      const data = await readFile(resolved)
      const ext = extname(resolved).toLowerCase()
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

      return new Response(data, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Security-Policy': PROD_CSP,
          // Same-origin module loads; keep CORS explicit for crossorigin attrs from Vite
          'Access-Control-Allow-Origin': `${PROTOCOL}://${HOST}`
        }
      })
    } catch (err) {
      console.error('[forge] protocol handler error', request.url, err)
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }
  })
}

function configureYoutubeReferer(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [
        '*://*.youtube.com/*',
        '*://*.youtube-nocookie.com/*',
        '*://*.ytimg.com/*',
        '*://youtu.be/*'
      ]
    },
    (details, callback) => {
      const headers = { ...details.requestHeaders }
      headers['Referer'] = 'https://www.youtube-nocookie.com/'
      headers['Origin'] = 'https://www.youtube-nocookie.com'
      callback({ requestHeaders: headers })
    }
  )
}

function configureCspHeaders(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders }
    if (is.dev) {
      if (
        details.url.startsWith('http://localhost') ||
        details.url.startsWith('http://127.0.0.1')
      ) {
        responseHeaders['Content-Security-Policy'] = [DEV_CSP]
      }
    } else if (details.url.startsWith(`${PROTOCOL}://`)) {
      responseHeaders['Content-Security-Policy'] = [PROD_CSP]
    }
    callback({ responseHeaders })
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.forge.app')

  registerAppProtocol()
  configureYoutubeReferer()
  configureCspHeaders()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (typeof url !== 'string') return
    const allowed = /^https?:\/\//i.test(url)
    if (!allowed) return
    await shell.openExternal(url)
  })

  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getPlatform', () => process.platform)

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
