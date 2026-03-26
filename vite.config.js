import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 이 부분 확인
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})