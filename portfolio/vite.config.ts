import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base for static hosting; WordPress injects DigivistacoTheme.assetsUrl for chunks
  base: './',
  build: {
    manifest: true,
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      // WordPress sets __DIGIVISTACO_ASSETS__ to the theme root URL (…/digivistaco-portfolio/)
      // filename is like "assets/HeroScene-xxxxx.js"
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
