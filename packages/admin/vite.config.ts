import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/cms': 'http://localhost:5500',
      '/api': 'http://localhost:5500',
    },
  },
  build: {
    outDir: '../core/public/admin',
    emptyOutDir: true,
  },
})
