import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000,
    strictPort: true,
    proxy: {
      '/boards': {
        target: 'http://localhost:5058',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:5058',
        ws: true,
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5058',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://localhost:5058',
        changeOrigin: true,
      },
    },
  },
})
