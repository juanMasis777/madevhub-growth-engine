import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend llama a /api/... y Vite lo pasa al backend Express (puerto 4000).
// Así funciona igual en tu computadora y en GitHub Codespaces, donde el
// navegador no puede llegar a localhost:4000.
const backend = `http://localhost:${process.env.PORT || 4000}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': backend },
  },
  preview: {
    proxy: { '/api': backend },
  },
})
