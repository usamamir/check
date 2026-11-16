import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single bundle for WordPress theme pack OR Hostinger/cPanel public_html upload
const isSingleBundle =
  process.env.VITE_WP_PACK === '1' || process.env.VITE_STATIC_PACK === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths so the site works at domain root (public_html) or a subfolder
  base: './',
  build: {
    manifest: true,
    // One JS file — safer on shared hosting (no missing chunk 404s)
    cssCodeSplit: !isSingleBundle,
    chunkSizeWarningLimit: isSingleBundle ? 1600 : 500,
    rolldownOptions: isSingleBundle
      ? {
          output: {
            codeSplitting: false,
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        }
      : undefined,
  },
  experimental: isSingleBundle
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
