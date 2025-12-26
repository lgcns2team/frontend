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
        // AI API도 Gateway로 통합 (8080)
        // '/api/ai/': { ... } 제거됨 -> 아래 '/api' 규칙이 적용됨
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
