<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { RefreshCw, X } from 'lucide-vue-next';

// 🦉 El motor que detecta si hay cambios en GitHub/Vercel
const { needRefresh, updateServiceWorker } = useRegisterSW();

const close = () => {
  needRefresh.value = false;
};

/**
 * 🚀 FUNCIÓN DE ACTUALIZACIÓN DINÁMICA
 * Al pulsar el banner, forzamos al Service Worker a saltar la espera (skipWaiting)
 * y recargar la ventana inmediatamente. Esto "mata" la versión vieja en la memoria.
 */
const handleUpdate = async () => {
    console.log("🚀 Búho Matemático: Reiniciando para instalar mejoras...");
    // El parámetro 'true' es vital para el refresco automático de la ventana
    await updateServiceWorker(true); 
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

/* Animación de rebote suave para llamar la atención en el escritorio del móvil */
.animate-bounce-slow { animation: bounce 3s infinite; }
@keyframes bounce { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-8px); } 
}
</style>