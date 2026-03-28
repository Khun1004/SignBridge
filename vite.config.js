import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,       // 포트 고정
    strictPort: true, // 포트 사용 중이면 다른 포트로 안 넘어감
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})