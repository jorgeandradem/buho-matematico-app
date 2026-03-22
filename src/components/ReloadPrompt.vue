<script setup>
/**
 * 🦉 ARCHIVO: ReloadPrompt.vue - VERSIÓN NUCLEAR SILENCIOSA v3.6
 * OBJETIVO: Automatización total con limpieza de caché forzada (Ajuste especial iOS).
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
    console.log("📢 ¡Nueva versión detectada! Ejecutando Protocolo de Actualización Nuclear...");
    handleUpdate();
  }
});

const handleUpdate = async () => {
  if (isUpdating.value) return;
  isUpdating.value = true;

  try {
    // A. Forzamos la actualización del Service Worker
    await updateServiceWorker(true);

    // B. Pausa técnica ampliada para darle tiempo de procesamiento a iOS (1500ms)
    setTimeout(() => {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isiOS) {
        // 🍎 BLINDAJE iOS/SAFARI: Rompemos la caché con Timestamp único
        const urlLimpia = window.location.origin + window.location.pathname;
        window.location.replace(`${urlLimpia}?v_upd=${Date.now()}`);
      } else {
        // 🤖 BLINDAJE ANDROID/PC: Refresco forzado desde servidor
        window.location.reload(true);
      }
    }, 1500);

  } catch (error) {
    console.error("⛔ Fallo en el refresco nuclear:", error);
    window.location.href = "/?force_v=" + Date.now();
  }
};
</script>

<template>
  <div v-if="false"></div>
</template>