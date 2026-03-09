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
      // 🚀 ESTRATEGIA DE AUTO-ACTUALIZACIÓN
      // Cambiado de 'prompt' a 'autoUpdate' para que el Service Worker se actualice solo.
      registerType: 'autoUpdate', 
      
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Búho Matemático', 
        short_name: 'Búho Mate', 
        description: 'Mentoría Matemática con IA para todas las edades',
        theme_color: '#4f46e5',
        background_color: '#4f46e5',
        display: 'standalone', // Obligatorio para que iOS lo trate como App
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
        // 🔥 Limpia automáticamente versiones antiguas de la caché
        cleanupOutdatedCaches: true,
        
        // 🚀 Estas dos líneas permiten la activación inmediata
        // El Service Worker nuevo no esperará a que se cierren las pestañas
        skipWaiting: true, 
        clientsClaim: true,

        // 🛡️ Evita conflictos con las rutas de autenticación de Firebase
        navigateFallbackDenylist: [/^\/__/],
        
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        
        // Límite de 5MB para soportar los recursos de los juegos (Soccer, Submarine, etc.)
        maximumFileSizeToCacheInBytes: 5000000 
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