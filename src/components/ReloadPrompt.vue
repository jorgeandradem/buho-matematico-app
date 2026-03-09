<script setup>
/**
 * 🦉 ARCHIVO DEFINITIVO: ReloadPrompt.vue (Versión Invisible)
 * ESTRUCTURA: Monitor Fantasma PWA v2.9.2
 * LOGICA: Actualización automática con refuerzo nuclear para iOS
 */
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (!r) return;
    console.log("📡 Radar PWA: Buscando actualizaciones activamente...");

    // 1. REVISIÓN INMEDIATA: Forzar búsqueda al iniciar
    r.update();

    // 2. REVISIÓN AL VOLVER AL FOCO: Vital para iOS al reabrir la app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        r.update();
      }
    });

    // 3. POLLING ACELERADO: Cada 20 minutos busca cambios silenciosamente
    setInterval(() => r.update(), 20 * 60 * 1000);
  },
  
  // Cuando el radar encuentra algo nuevo, dispara la limpieza
  onNeedRefresh() {
    console.log("🆕 Mejoras listas. Iniciando actualización automática...");
    applySilentUpdate();
  },
  
  onRegisterError(error) {
    console.error("❌ Fallo en el motor del Service Worker:", error);
  }
});

/**
 * 🚀 ESTRATEGIA DE ACTUALIZACIÓN QUIRÚRGICA
 */
const applySilentUpdate = async () => {
  try {
    // Paso 1: Forzar al nuevo Service Worker a tomar el mando (SKIP_WAITING)
    await updateServiceWorker(true);
    
    // Paso 2: Identificar dispositivo para aplicar refuerzo nuclear
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isiOS) {
      // Refuerzo para Safari/iOS: Timestamp único para saltar el caché del index.html
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.replace(`${cleanUrl}?v=${Date.now()}`);
    } else {
      // Refresco estándar para Android y PC
      window.location.reload(true);
    }
  } catch (error) {
    console.error("❌ Error en actualización silenciosa:", error);
    window.location.reload();
  }
};
</script>

<template>
  <div v-if="false"></div>
</template>