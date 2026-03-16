<script setup>
/**
 * 🦉 ARCHIVO: ReloadPrompt.vue - VERSIÓN NUCLEAR SILENCIOSA v3.0
 * OBJETIVO: Automatización total e invisible para iOS.
 * LOGICA: Refresco forzado mediante timestamp para romper caché de Safari.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { ref, watch } from 'vue';

const isUpdating = ref(false);

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (!r) return;
    
    // 1. Revisión inmediata al cargar
    r.update();
    
    // 2. Disparador por visibilidad (Vital para iPhone cuando regresas al nido)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') r.update();
    });

    // 3. Radar constante cada 10 minutos
    setInterval(() => r.update(), 10 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("🦉 Error en el radar del Búho:", error);
  }
});

// --- 🤖 DISPARADOR AUTOMÁTICO E INVISIBLE ---
watch(needRefresh, (newValue) => {
  if (newValue) {
    // No esperamos el "segundo de oro" visual, procedemos al refresco nuclear
    handleUpdate();
  }
});

const handleUpdate = async () => {
  if (isUpdating.value) return;
  
  isUpdating.value = true;
  console.log("🚀 Iniciando actualización silenciosa v2.9.4...");

  try {
    // A. Forzamos al Service Worker a tomar el control
    await updateServiceWorker(true);

    // B. Pequeña tregua para que el sistema asiente los archivos
    setTimeout(() => {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isiOS) {
        // 🍎 BLINDAJE iOS: Refresco con timestamp para limpiar Safari
        const urlLimpia = window.location.origin + window.location.pathname;
        window.location.replace(`${urlLimpia}?update=${Date.now()}`);
      } else {
        // Blindaje Android/Chrome: Limpieza de caché activa
        window.location.reload(true);
      }
    }, 200);

  } catch (error) {
    // Última ratio: Refresco forzado por URL
    window.location.href = "/?v=" + Date.now();
  }
};
</script>

<template>
  <div v-if="false"></div>
</template>

<style scoped>
/* No se requiere CSS, el nido es invisible */
</style>