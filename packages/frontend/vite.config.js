import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import eslint from 'vite-plugin-eslint'
import path from 'path'

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      eslint({
        include: ['src/**/*.js', 'src/**/*.vue'],
        exclude: ['node_modules', 'dist'],
        cache: false,
        fix: false,
        lintOnStart: true,
        emitWarning: true,
        emitError: true,
        failOnWarning: false,
        failOnError: false
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../../shared')
      }
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
  }
})
