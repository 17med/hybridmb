/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths: Cordova serves www/ from its own origin, not from '/'.
  base: './',
  build: {
    // The Cordova wrapper packages whatever is in cordova/www.
    outDir: 'cordova/www',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    legacy()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
