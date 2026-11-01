import { defineConfig } from "vite";

/** Prototipo SPA en sandbox — puerto 5174 para no chocar con web/ (5173) ni visor/. */
export default defineConfig({
  root: ".",
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },
});
