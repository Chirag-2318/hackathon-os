import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { defineConfig } from 'vite'

const backendTarget = 'http://127.0.0.1:8080'

function configureProxy(proxy: any) {
  proxy.on('error', (err: any, _req: any, res: any) => {
    // Gracefully handle backend downtime/restarts without dumping noisy stack traces into terminal
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      if (!res.headersSent && res.writeHead) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Backend server is unavailable or restarting' }))
      }
      return
    }
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
      '/oauth2': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
      '/login/oauth2': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
      '/swagger-ui': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
      '/swagger-ui.html': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
      '/v3/api-docs': {
        target: backendTarget,
        changeOrigin: true,
        configure: configureProxy,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})


