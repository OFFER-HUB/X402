import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  appType: 'spa',
  server: {
    port: 5173,
    proxy: {
      // Only proxy the SSE events endpoint — NOT /dashboard itself (that's the SPA route)
      '/dashboard/events': 'http://localhost:3000',
      '/search': 'http://localhost:3000',
      '/finance': 'http://localhost:3000',
      '/inference': 'http://localhost:3000',
      '/session': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/transactions': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true,
  },
})
