import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        // Proxy API calls during dev to your Express backend
        '/send-discord-message': {
          target: api,
          changeOrigin: true
        },
        // Fallback proxy for entity routes if you prefer not to hardcode each
        '^(?:/(abilities|equipment|characters|rules|expansions|cultures|ancestries|worldelements))': {
          target: api,
          changeOrigin: true
        }
      }
    }
  }
})
