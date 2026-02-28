<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { RefreshCw, X } from 'lucide-vue-next';

// 🦉 Motor de detección de actualizaciones
const { needRefresh, updateServiceWorker } = useRegisterSW();

const close = () => {
  needRefresh.value = false;
};

/**
 * 🚀 FUNCIÓN DE ACTUALIZACIÓN DINÁMICA CON REFUERZO
 * Intentamos la actualización oficial y, si el Service Worker se queda trabado,
 * forzamos un refresco total de la ventana después de 1.5 segundos.
 */
const handleUpdate = async () => {
    console.log("🚀 Búho Matemático: Iniciando limpieza de memoria y actualización...");
    
    try {
        // 1. Vía oficial: solicita al Service Worker que salte la espera y recargue
        await updateServiceWorker(true);
        
        // 2. 🚨 SEGURO DE VIDA: Si el navegador no ha reiniciado por sí solo en 1.5s,
        // lo obligamos manualmente para eliminar la versión vieja de la RAM.
        setTimeout(() => {
            console.log("⚠️ Forzando recarga manual del nido...");
            window.location.reload(true); 
        }, 1500);

    } catch (error) {
        console.error("❌ Fallo crítico al actualizar, forzando recarga nuclear...", error);
        window.location.reload(true);
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
/* Animación de entrada fluida */
.animate-pop-in { 
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; 
}
@keyframes popIn { 
  from { opacity: 0; transform: scale(0.8) translateY(40px) translateX(-50%); } 
  to { opacity: 1; transform: scale(1) translateY(0) translateX(-50%); } 
}

/* Animación de rotación del icono */
.animate-spin-slow { animation: spin 4s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Animación de rebote suave */
.animate-bounce-slow { animation: bounce 3s infinite; }
@keyframes bounce { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-8px); } 
}
</style>