import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isWpPack = process.env.VITE_WP_PACK === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base for static hosting; WordPress injects __DIGIVISTACO_ASSETS__ for chunks
  base: './',
  build: {
    manifest: true,
    // WordPress theme: one JS file so Update→2026 cannot blank on missing chunks
    cssCodeSplit: !isWpPack,
    chunkSizeWarningLimit: isWpPack ? 1600 : 500,
    rolldownOptions: isWpPack
      ? {
          output: {
            codeSplitting: false,
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        }
      : undefined,
  },
  experimental: isWpPack
    ? undefined
    : {
        renderBuiltUrl(filename, { hostType }) {
          // WordPress sets __DIGIVISTACO_ASSETS__ to the theme root URL (…/digivistaco-portfolio/)
          if (hostType === 'js') {
            const relativeFromBundle = './' + filename.replace(/^assets\//, '')
            return {
              runtime: `globalThis.__DIGIVISTACO_ASSETS__?new URL(${JSON.stringify(filename)},globalThis.__DIGIVISTACO_ASSETS__).href:${JSON.stringify(relativeFromBundle)}`,
            }
          }
          return { relative: true }
        },
      },
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})
