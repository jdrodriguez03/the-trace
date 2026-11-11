// Dueño: Juan Angel
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // Cambia en cada build: así el navegador no usa un app.js viejo guardado en caché.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
})
