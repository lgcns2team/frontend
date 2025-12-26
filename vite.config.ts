import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // AI 관련 요청 → Python 백엔드 (8000)
        '/api/ai/': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/ai\//, '/api/')  // /api/ai/ → /api/
        },
        // WebSocket → Java 백엔드 (8080)
        '/api/ws-stomp': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '')  // /api/ws-stomp → /ws-stomp
        },
        // 나머지 API → Java 백엔드 (8080)
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080/api',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
      },
    },
    define: {
      global: 'globalThis',
    },
  }
})
