import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa' // 🦉 Motor de instalación y actualización

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      // 🦉 CONFIGURACIÓN DE ACTUALIZACIÓN (v2.9.3)
      // 'prompt' permite que nuestro componente ReloadPrompt controle el reinicio
      registerType: 'prompt', 
      
      // Asegura que el Service Worker se registre automáticamente en el navegador
      injectRegister: 'auto',
      
      // Recursos que deben estar disponibles offline
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
            purpose: 'any maskable' // Optimiza el icono para Android/iOS
          }
        ]
      },

      // 🦉 MOTOR DE TRABAJO (Workbox) - El cerebro del reinicio forzado
      workbox: {
        // Borra versiones antiguas de la caché automáticamente al actualizar
        cleanupOutdatedCaches: true,
        // No salta la espera automáticamente; permite que el usuario pulse "Actualizar"
        skipWaiting: false, 
        // Toma el control de las pestañas abiertas inmediatamente tras actualizar
        clientsClaim: true,
      },

      // 🦉 MEJORA PARA DESARROLLO:
      // Permite probar el banner de actualización en modo local (npm run dev)
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})