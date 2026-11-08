import { resolve, join, extname } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createReadStream, existsSync, statSync, cpSync, mkdirSync } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin } from 'vite'

const IMAGE_ROOT = resolve('resources/exercise-images')

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

function serveExerciseImages(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void
): void {
  if (!req.url?.startsWith('/exercise-images/')) {
    next()
    return
  }
  const rel = decodeURIComponent(req.url.slice('/exercise-images/'.length).split('?')[0])
  const filePath = join(IMAGE_ROOT, rel)
  if (!filePath.startsWith(IMAGE_ROOT) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream')
  createReadStream(filePath).pipe(res)
}

function exerciseImagesPlugin(): Plugin {
  return {
    name: 'forge-exercise-images',
    configureServer(server) {
      server.middlewares.use(serveExerciseImages)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveExerciseImages)
    },
    closeBundle() {
      if (!existsSync(IMAGE_ROOT)) return
      const dest = resolve('out/renderer/exercise-images')
      mkdirSync(dest, { recursive: true })
      cpSync(IMAGE_ROOT, dest, { recursive: true })
    }
  }
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss(), exerciseImagesPlugin()],
    build: {
      assetsInlineLimit: 4096
    }
  }
})
