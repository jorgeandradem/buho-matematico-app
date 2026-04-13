<script setup>
/**
 * 🦉 ARCHIVO: ReloadPrompt.vue - VERSIÓN ULTRA-SILENCIOSA v4.0
 * OBJETIVO: Automatización total. Limpieza de caché quirúrgica y refresco invisible.
 * INTEGRACIÓN: Diseñado para funcionar con vite-plugin-pwa en modo 'autoUpdate'.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { watch, onMounted } from 'vue';

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (!r) return;

    // 1. REVISIÓN INMEDIATA: Al entrar al nido, buscamos actualizaciones.
    r.update();

    // 2. DISPARADOR POR VISIBILIDAD: Crucial cuando el alumno vuelve a la App.
    // Si la App estaba en segundo plano, al abrirla el Búho revisa si hay mejoras.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        r.update();
      }
    });

    // 3. RADAR DE SEGURIDAD: Cada 15 minutos por si hay un despliegue crítico.
    setInterval(() => r.update(), 15 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("🦉 Error en el radar del Búho:", error);
  }
});

/**
 * --- 🤖 PROTOCOLO DE ACTUALIZACIÓN INVISIBLE ---
 * Se activa en cuanto el Service Worker detecta que el servidor tiene código nuevo.
 */
watch(needRefresh, async (newValue) => {
  if (newValue) {
    console.log("📢 ¡Nueva versión detectada! Ejecutando limpieza nuclear...");

    try {
      // A. DEMOLICIÓN DE CACHÉ (Blindaje iOS/Safari):
      // Borramos las cachés físicas del navegador para evitar que iOS sirva archivos viejos.
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            console.log(`🧹 Eliminando caché antigua: ${name}`);
            return caches.delete(name);
          })
        );
      }

      // B. ACTUALIZACIÓN DEL WORKER:
      // Le decimos al Service Worker que tome el control ahora mismo.
      await updateServiceWorker(true);

      // C. RECARGA LIMPIA:
      // Pausa técnica de 600ms para asegurar que el sistema de archivos se asiente.
      setTimeout(() => {
        // Forzamos recarga desde el origen, no desde la memoria volátil.
        window.location.reload();
      }, 600);

    } catch (error) {
      console.error("⛔ Fallo en el refresco nuclear:", error);
      // Plan de rescate: recarga forzada con timestamp para romper cualquier proxy.
      window.location.href = window.location.pathname + "?v=" + Date.now();
    }
  }
});
</script>

<template>
  <div v-if="false"></div>
</template>