import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // I moduli Node.js sono usati solo nel branch typeof window === 'undefined'
      // (test locale con claude CLI). Nel bundle browser non vengono mai chiamati.
      external: ['child_process', 'fs', 'path', 'url'],
    },
  },
  optimizeDeps: {
    exclude: ['child_process', 'fs', 'path', 'url'],
  },
})
