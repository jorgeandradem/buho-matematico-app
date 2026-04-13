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
      // 🚀 ESTRATEGIA DE ACTUALIZACIÓN AUTOMÁTICA
      // Cambiamos 'prompt' por 'autoUpdate' para eliminar el aviso manual del navegador.
      registerType: 'autoUpdate', 
      
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
        // 🧹 Limpieza automática de cachés de versiones anteriores
        cleanupOutdatedCaches: true,
        
        // ⚡ ACTIVACIÓN INMEDIATA: 
        // skipWaiting hace que el nuevo Service Worker tome el control sin esperar a que se cierre la app.
        // clientsClaim permite que el SW controle las pestañas abiertas desde el primer segundo.
        skipWaiting: true, 
        clientsClaim: true,
        
        // 🛡️ PATRONES DE CACHÉ (Incluye MP3 para el Búho, excluye MP4 para ligereza)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,jpg,jpeg,mp3}'],
        
        // Seguridad para rutas de API o autenticación externa
        navigateFallbackDenylist: [/^\/__/, /^\/api/],
        
        // Límite de 5MB por archivo para asegurar rendimiento en móviles modestos
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