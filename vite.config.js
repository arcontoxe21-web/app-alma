import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    base: '/Alma-Elite/',
    plugins: [
        basicSsl()
    ],
    server: {
        host: true,
        https: true
    }
})
