import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "../assets-source"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    // Temporary public tunnels (cloudflared / localtunnel) rewrite Host
    allowedHosts: true,
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
  },
});
