import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api calls and poster images are forwarded to the Java server running on port 8080
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/assets': 'http://localhost:8080',
    },
  },
})
