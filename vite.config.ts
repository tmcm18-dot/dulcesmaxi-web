import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        editor: resolve(root, 'editor.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react'
          }
          return undefined
        },
      },
    },
  },
})
