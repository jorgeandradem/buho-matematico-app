<script setup>
/**
 * 🦉 ARCHIVO: ReloadPrompt.vue - VERSIÓN NUCLEAR SILENCIOSA v3.6
 * OBJETIVO: Automatización total. Android intacto + Demolición de Caché en iOS.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { ref, watch, onMounted } from 'vue';

const isUpdating = ref(false);

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (!r) return;
    
    // 1. Revisión inmediata al cargar el nido
    r.update();
    
    // 2. Disparador por visibilidad (Crucial para el despertar del Búho en móviles)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') r.update();
    });

    // 3. Radar de seguridad constante (cada 5 minutos)
    setInterval(() => r.update(), 5 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("🦉 Error en el radar del Búho:", error);
  }
});

// --- 🤖 DETECTOR AUTOMÁTICO DE NUEVA VERSIÓN ---
watch(needRefresh, (newValue) => {
  if (newValue) {
    console.log("📢 ¡Nueva versión detectada! Ejecutando Protocolo v2.9.6...");
    handleUpdate();
  }
});

const handleUpdate = async () => {
  if (isUpdating.value) return;
  isUpdating.value = true;

  try {
    // A. Forzamos la actualización del Service Worker
    await updateServiceWorker(true);

    // B. Pausa técnica (800ms da tiempo a iOS de procesar el nuevo worker)
    setTimeout(async () => {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isiOS) {
        // 🍎 BLINDAJE iOS/SAFARI: Demolición de Caché Nativa + Recarga Limpia
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          // Recargamos sin alterar la URL para no romper el modo "App" de iOS
          window.location.replace(window.location.origin + window.location.pathname);
        } catch (e) {
          console.error("Fallo al limpiar caché iOS:", e);
          window.location.reload(); 
        }
      } else {
        // 🤖 BLINDAJE ANDROID/PC: Intacto, tal cual te funciona perfecto
        window.location.reload(true);
      }
    }, 800);

  } catch (error) {
    console.error("⛔ Fallo en el refresco nuclear:", error);
    window.location.href = "/?force_v=" + Date.now();
  }
};
</script>

<template>
  <div v-if="false"></div>
</template>