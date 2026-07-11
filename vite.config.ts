import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://192.168.0.206:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'react-vendor'
          }

          if (id.includes('/@ant-design/icons/')) {
            return 'antd-icons'
          }

          const antdComponentMatch = id.match(/\/antd\/es\/([^/]+)/)
          if (antdComponentMatch?.[1]) {
            return `antd-${antdComponentMatch[1]}`
          }

          const rcPackageMatch = id.match(/\/(rc-[^/]+)/)
          if (rcPackageMatch?.[1]) {
            return rcPackageMatch[1]
          }

          if (id.includes('/@ant-design/')) {
            return 'ant-design-vendor'
          }

          if (id.includes('/dayjs/')) {
            return 'dayjs-vendor'
          }

          return 'vendor'
        },
      },
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
