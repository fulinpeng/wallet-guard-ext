import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig({
  plugins: [crx({ manifest })],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
