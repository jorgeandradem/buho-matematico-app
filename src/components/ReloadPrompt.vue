<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { RefreshCw, X } from 'lucide-vue-next';

/**
 * 🕵️ Motor de detección de actualizaciones PWA.
 * needRefresh se activará automáticamente cuando Vite detecte un nuevo build.
 */
const { needRefresh, updateServiceWorker } = useRegisterSW();

const close = () => {
  needRefresh.value = false;
};

/**
 * 🚀 FUNCIÓN DE ACTUALIZACIÓN CON REFUERZO
 * 1. Solicita al Service Worker que tome el control (skipWaiting).
 * 2. Si en 1.5s la página no ha refrescado, forzamos una recarga "nuclear"
 * para limpiar la caché persistente del navegador.
 */
const handleUpdate = async () => {
    console.log("🚀 Búho Matemático: Sincronizando nueva versión...");
    
    try {
        // Paso 1: Vía oficial de Vite PWA
        await updateServiceWorker(true);
        
        // Paso 2: Refuerzo para móviles (si el paso 1 no dispara el reload)
        setTimeout(() => {
            console.log("⚠️ Refuerzo: Forzando recarga manual de seguridad.");
            window.location.reload(); 
        }, 1500);

    } catch (error) {
        console.error("❌ Fallo crítico de actualización:", error);
        window.location.reload();
    }
};
</script>

<template>
  <div v-if="needRefresh" 
       class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-sm animate-pop-in">
    
    <div class="relative group">
      <button @click="handleUpdate" 
              class="w-full bg-yellow-400 text-indigo-900 p-4 rounded-[2.5rem] shadow-2xl border-4 border-indigo-600 flex items-center gap-4 active:scale-95 transition-all animate-bounce-slow">
        
        <div class="bg-indigo-600 p-2 rounded-2xl text-white shadow-inner">
          <RefreshCw class="animate-spin-slow" :size="28" />
        </div>
        
        <div class="flex-1 text-left">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-800 opacity-80">¡Nido Actualizado!</p>
          <p class="text-sm font-black leading-none uppercase tracking-tighter text-indigo-900">Toca para Reiniciar</p>
          <p class="text-[9px] font-bold mt-1 opacity-70">Hay mejoras listas para tu Búho.</p>
        </div>
      </button>

      <button @click.stop="close" 
              class="absolute -top-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white shadow-lg active:scale-90">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Animación de entrada: escala y sube */
.animate-pop-in { 
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; 
}
@keyframes popIn { 
  from { opacity: 0; transform: scale(0.8) translateY(40px) translateX(-50%); } 
  to { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); } 
}

/* Animación de rotación del icono de refresco */
.animate-spin-slow { animation: spin 4s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Rebote suave para llamar la atención del usuario */
.animate-bounce-slow { animation: bounce 3s infinite; }
@keyframes bounce { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-8px); } 
}
</style>