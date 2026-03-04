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
      // 🛠️ Mantenemos 'prompt' para que el usuario vea tu componente ReloadPrompt.vue
      registerType: 'prompt', 
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Búho Matemático', 
        short_name: 'Búho Mate', 
        description: 'Mentoría Matemática con IA para todas las edades',
        theme_color: '#4f46e5',
        background_color: '#4f46e5',
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
        // 🔥 REFUERZO DE LIMPIEZA: Borra versiones viejas de la caché automáticamente
        cleanupOutdatedCaches: true,
        // 🚀 PERMISOS DE REINICIO: Permite que el nuevo Service Worker se active de inmediato
        skipWaiting: true, 
        clientsClaim: true,
        // 🛡️ SEGURIDAD PARA FIREBASE: Evita que el Service Worker interfiera con las rutas de Auth de Firebase
        navigateFallbackDenylist: [/^\/__/],
        // Definimos qué archivos se guardan para modo offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Aumentamos el límite de tamaño para evitar que archivos grandes se queden fuera de la caché
        maximumFileSizeToCacheInBytes: 4000000 
      },
      devOptions: {
        // IMPORTANTE: Mantenlo en true para poder probar el banner en localhost
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      // Alias estándar para importar con @/
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})