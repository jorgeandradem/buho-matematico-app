<script setup>
/**
 * 🦉 ARCHIVO: ReloadPrompt.vue - VERSIÓN NUCLEAR v2.9.2
 * OBJETIVO: Vencer el congelamiento de iOS y Android.
 */
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { RefreshCw, Zap, X } from 'lucide-vue-next';
import { ref } from 'vue';

const isUpdating = ref(false);

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    if (!r) return;
    // Radar activo: Revisar actualización cada vez que se abre
    r.update();
    
    // Disparador por visibilidad (iOS Clave)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') r.update();
    });

    // Check forzado cada 10 minutos
    setInterval(() => r.update(), 10 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("SW Error:", error);
  }
});

const handleUpdate = async () => {
  if (isUpdating.value) return;
  
  isUpdating.value = true;
  console.log("🚀 Disparando reinicio nuclear...");

  try {
    // 1. Comando de SKIP_WAITING (Obliga al SW a tomar el mando ya)
    await updateServiceWorker(true);

    // 2. Pequeña espera para que el SW se asiente en el navegador
    setTimeout(() => {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isiOS) {
        // 3. EL COMANDO PODEROSO PARA iOS:
        // window.location.reload no sirve en Safari PWA. 
        // Usamos replace con un 'cache-buster' único.
        const urlLimpia = window.location.origin + window.location.pathname;
        window.location.replace(`${urlLimpia}?update=${Date.now()}`);
      } else {
        // Refuerzo para Android: Limpieza de caché forzada
        window.location.reload(true);
      }
    }, 500);

  } catch (error) {
    // Si todo falla, el último recurso: F5 puro
    window.location.href = "/?v=" + Date.now();
  }
};

const close = () => {
  needRefresh.value = false;
};
</script>

<template>
  <Transition name="bounce">
    <div v-if="needRefresh" 
         class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-sm">
      
      <div class="relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem]">
        <button @click.prevent.stop="handleUpdate" 
                :disabled="isUpdating"
                class="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-indigo-950 p-5 rounded-[2.5rem] border-4 border-indigo-900 flex items-center gap-4 active:scale-90 transition-all overflow-hidden relative"
                :class="{ 'opacity-80 grayscale': isUpdating }">
          
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

          <div class="bg-indigo-900 p-3 rounded-2xl text-white shadow-xl flex shrink-0">
            <RefreshCw :class="{ 'animate-spin': isUpdating, 'animate-[spin_4s_linear_infinite]': !isUpdating }" :size="28" />
          </div>
          
          <div class="flex-1 text-left">
            <p class="text-[11px] font-black uppercase tracking-widest text-indigo-900/60 leading-none mb-1">Mejoras en el nido</p>
            <h3 class="text-lg font-black leading-none uppercase tracking-tighter text-indigo-950">
              {{ isUpdating ? 'ACTUALIZANDO...' : '¡REINICIAR AHORA!' }}
            </h3>
            <p class="text-[10px] font-bold mt-1 text-indigo-900/80">Toca para aplicar los cambios del Búho.</p>
          </div>

          <Zap v-if="!isUpdating" class="text-indigo-900 animate-pulse" size="24" />
        </button>

        <button @click.stop="close" 
                class="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center active:scale-75 transition-transform">
          <X :size="16" stroke-width="3" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bounce-enter-active { animation: bounce-in 0.6s; }
.bounce-leave-active { animation: bounce-in 0.4s reverse; }

@keyframes bounce-in {
  0% { transform: scale(0.5) translateY(100px) translateX(-50%); opacity: 0; }
  60% { transform: scale(1.1) translateY(-10px) translateX(-50%); opacity: 1; }
  100% { transform: scale(1) translateY(0) translateX(-50%); }
}

@keyframes shimmer {
  100% { transform: translateX(100%); }
}
</style>