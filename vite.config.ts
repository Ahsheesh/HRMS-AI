// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Existing proxy for your Node.js API
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Add this new proxy rule for the Python AI service
      '/ai-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai-api/, ''),
      },
    },
  },
})