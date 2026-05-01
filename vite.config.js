import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  resolve: {
    alias: {
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs'
    }
  }
})
