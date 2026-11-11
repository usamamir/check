import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const themeRoot = resolve(__dirname, 'wp-content/themes/jettribe');

export default defineConfig({
  root: themeRoot,
  base: './',
  publicDir: false,
  build: {
    outDir: resolve(themeRoot, 'dist'),
    emptyOutDir: true,
    manifest: true,
    sourcemap: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(themeRoot, 'src/entries/main.ts'),
        home: resolve(themeRoot, 'src/entries/home.ts'),
        shop: resolve(themeRoot, 'src/entries/shop.ts'),
        product: resolve(themeRoot, 'src/entries/product.ts'),
        three: resolve(themeRoot, 'src/entries/three.ts'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'es2022',
    modulePreload: { polyfill: false },
  },
  server: {
    origin: 'http://localhost:5173',
  },
});
