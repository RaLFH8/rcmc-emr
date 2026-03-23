import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.js'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    // Property-based testing configuration
    testTimeout: 30000, // Increased timeout for property tests
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.ts',
        'src/tests/generators/',
        '**/*.d.ts'
      ]
    }
  }
})
