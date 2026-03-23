import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  optimizeDeps: {
    force: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom'],
          // Charting libraries
          'vendor-charts': ['recharts'],
          // PDF/export utilities
          'vendor-pdf': ['jspdf', 'html2canvas'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Spreadsheet/export
          'vendor-xlsx': ['xlsx'],
          // Date utilities
          'vendor-date': ['date-fns'],
          // Icons
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js'
  }
})
