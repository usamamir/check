import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// Engine unit tests land in Phase 5 under features/generator/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/renderer/src/features/generator/**/*.test.ts', 'src/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': resolve('src/renderer/src'),
      '@renderer': resolve('src/renderer/src')
    }
  }
})
