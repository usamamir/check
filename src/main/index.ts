import { app, shell, BrowserWindow, ipcMain, protocol, net, session } from 'electron'
import { join, normalize } from 'path'
import { pathToFileURL } from 'url'
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

function registerAppProtocol(): void {
  protocol.handle(PROTOCOL, async (request) => {
    const url = new URL(request.url)
    let pathname = decodeURIComponent(url.pathname)
    if (!pathname || pathname === '/') {
      pathname = '/index.html'
    }

    const rendererRoot = join(__dirname, '../renderer')
    const resolved = normalize(join(rendererRoot, pathname))

    if (!resolved.startsWith(rendererRoot)) {
      return new Response('Forbidden', { status: 403 })
    }

    try {
      const response = await net.fetch(pathToFileURL(resolved).toString())
      const headers = new Headers(response.headers)
      headers.set('Content-Security-Policy', PROD_CSP)
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    } catch {
      return new Response('Not Found', { status: 404 })
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
