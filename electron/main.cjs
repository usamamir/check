const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

const isDev = !app.isPackaged
let server

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    }[ext] || 'application/octet-stream'
  )
}

/** Serve dist over localhost so YouTube embeds work (file:// blocks many players). */
function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath)
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403)
          res.end('Forbidden')
          return
        }
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(rootDir, 'index.html')
        }
        const data = fs.readFileSync(filePath)
        res.writeHead(200, {
          'Content-Type': contentType(filePath),
          // Allow YouTube iframe API
          'Content-Security-Policy':
            "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data:;",
        })
        res.end(data)
      } catch (err) {
        res.writeHead(500)
        res.end(String(err))
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (!addr || typeof addr === 'string') reject(new Error('No port'))
      else resolve(addr.port)
    })
  })
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 390,
    minHeight: 640,
    backgroundColor: '#0c1412',
    autoHideMenuBar: true,
    show: false,
    title: 'Repwise',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    // Keep YouTube embeds inside the app; open other links externally
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173')
  } else {
    const dist = path.join(__dirname, '..', 'dist')
    const port = await startStaticServer(dist)
    await win.loadURL(`http://127.0.0.1:${port}/`)
  }
}

app.whenReady().then(async () => {
  await createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (server) server.close()
  if (process.platform !== 'darwin') app.quit()
})
