<script setup>
import { onMounted } from 'vue';

const emit = defineEmits(['members', 'newcomers', 'close']);

// --- NUEVO: Función para reproducir el ulular (owl.mp3) ---
const playOwlSound = () => {
  try {
    const audio = new Audio('/audios/owl.mp3');
    audio.volume = 0.9; // Volumen al 90% para que no asuste
    audio.play().catch(e => console.log('El auto-play fue bloqueado por el navegador', e));
  } catch (error) {
    console.error('Error al reproducir el sonido', error);
  }
};

onMounted(() => {
  // Reproducimos el sonido con un ligerísimo retraso de 300ms 
  // para que coincida con la animación de aparición del Búho
  setTimeout(() => {
    playOwlSound();
  }, 300);
});

const goToMembers = () => {
  emit('members'); 
};

const goToNewcomers = () => {
  emit('newcomers'); 
};

const goBack = () => {
  emit('close');
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas relative overflow-hidden bg-indigo-950">
      
      <video 
        src="/videos/buhonav.mp4" 
        autoplay 
        loop 
        muted 
        playsinline
        class="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
      ></video>

      <div class="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-transparent to-indigo-900/60 z-0 pointer-events-none"></div>

      <button @click="goBack" class="btn-close-css animate-pop-in" aria-label="Volver a inicio"></button>

      <header class="absolute top-16 left-0 w-full flex justify-center z-10 px-6">
        <button @click="goToMembers" class="glass-capsule animate-pop-in" style="animation-delay: 0.1s;">
          Miembros
        </button>
      </header>

      <footer class="absolute bottom-12 left-0 w-full flex justify-center z-10 px-6">
        <button @click="goToNewcomers" class="glass-capsule animate-pop-in" style="animation-delay: 0.2s;">
          Nuevo Alumno
        </button>
      </footer>

    </main>
  </div>
</template>

<style scoped>
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9;
  overflow: hidden;
  touch-action: none !important;
}

.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  background-color: #f8fafc;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  touch-action: none !important;
  -webkit-tap-highlight-color: transparent;
  width: 100vw;
  height: 100dvh;
}

@media (min-width: 1025px) {
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; }
}
@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

.btn-close-css {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem; 
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 50; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-close-css:active { transform: scale(0.85); background: rgba(255, 255, 255, 0.3); }

.btn-close-css::before,
.btn-close-css::after {
  content: ''; position: absolute; width: 20px; height: 2.5px; background-color: white; border-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); 
}

.btn-close-css::before { transform: rotate(45deg); }
.btn-close-css::after { transform: rotate(-45deg); }

.glass-capsule {
  width: 100%;
  max-width: 320px;
  padding: 1.25rem 2rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px); 
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 9999px; 
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 1.15rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3); 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-capsule:active { transform: scale(0.95); background: rgba(255, 255, 255, 0.25); box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2); }

.animate-pop-in { opacity: 0; animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>