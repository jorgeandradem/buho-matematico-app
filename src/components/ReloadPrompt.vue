<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { RefreshCw, X } from 'lucide-vue-next';

/**
 * 🕵️ Motor de detección de actualizaciones PWA (Mejorado)
 * Se agregaron los eventos onRegistered para obligar al navegador a buscar
 * nuevas versiones de forma proactiva y no solo al cargar la página.
 */
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) {
    console.log("📡 Service Worker PWA activo. Radar de actualizaciones encendido.");

    // 1. REVISIÓN ACTIVA: Buscar actualización cada vez que la app vuelve a primer plano
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log("🔍 App en foco: Buscando actualizaciones silenciosamente...");
        r?.update();
      }
    });

    // 2. REVISIÓN PASIVA: Buscar automáticamente cada 1 hora (por si dejan la pantalla encendida)
    setInterval(() => {
      r?.update();
    }, 60 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error("❌ Error en el Service Worker:", error);
  }
});

const close = () => {
  needRefresh.value = false;
};

/**
 * 🚀 FUNCIÓN DE ACTUALIZACIÓN CON REFUERZO NUCLEAR
 */
const handleUpdate = async () => {
  console.log("🚀 Búho Matemático: Instalando nueva versión...");
  
  // Ocultamos el banner al instante para evitar doble clic
  needRefresh.value = false;
    
  try {
      // Paso 1: Envía el mensaje 'SKIP_WAITING' al SW.
      // vite-plugin-pwa automáticamente escucha el cambio y hace reload,
      // pero en móviles Safari a veces falla.
      await updateServiceWorker(true);
      
      // Paso 2: Refuerzo para móviles. Si en 1.5s no ha refrescado, forzamos recarga limpiando caché de ruta.
      setTimeout(() => {
          console.log("⚠️ Refuerzo táctico: Forzando recarga manual de seguridad.");
          // Engañamos a la caché del navegador recargando la URL limpia
          window.location.href = window.location.href.split('?')[0] + '?v=' + new Date().getTime();
      }, 1500);

  } catch (error) {
      console.error("❌ Fallo de actualización, forzando F5:", error);
      window.location.reload();
  }
};
</script>

<template>
  <div v-if="needRefresh" 
       class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm animate-pop-in">
    
    <div class="relative group">
      <button @click.prevent.stop="handleUpdate" 
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