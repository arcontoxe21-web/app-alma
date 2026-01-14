import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    base: '/app-alma/',
    plugins: [
        basicSsl()
    ],
    server: {
        host: true,
        https: true
    }
})
