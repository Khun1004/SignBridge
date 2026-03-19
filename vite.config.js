import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 이 부분 확인
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(), // react 플러그인이 tailwind보다 앞에 오는 것이 좋습니다.
    tailwindcss(),
  ],
})