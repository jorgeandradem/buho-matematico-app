import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      // 🚀 CAMBIO TÁCTICO: Usamos 'prompt' para que nuestra lógica en ReloadPrompt.vue 
      // tenga el control total del refresco nuclear y el timestamp de iOS.
      registerType: 'prompt', 
      
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Búho Matemático', 
        short_name: 'Búho Mate', 
        description: 'Mentoría Matemática con IA para todas las edades',
        theme_color: '#4f46e5',
        background_color: '#4f46e5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        // ⚡ Forzamos la toma de control inmediata
        skipWaiting: true, 
        clientsClaim: true,
        
        // 🛡️ Blindaje de archivos para caché (CIRUGÍA APLICADA: SE AGREGÓ mp3, EXCLUIDO mp4)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,jpg,jpeg,mp3}'],
        navigateFallbackDenylist: [/^\/__/, /^\/api/],
        maximumFileSizeToCacheInBytes: 5000000 // Límite de 5MB por archivo
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})