import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1043,
    strictPort: true,
    allowedHosts: ['energylab.eminkartci.com'],
  },
  preview: {
    port: 1043,
    strictPort: true,
    allowedHosts: ['energylab.eminkartci.com'],
  },
})
