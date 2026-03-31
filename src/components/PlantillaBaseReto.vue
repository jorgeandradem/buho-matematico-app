<script setup>
// 1. Imports y Lógica de Monedas de Sesión
import { ref } from 'vue';
// 🛠️ FIX: Se añadieron las importaciones de los iconos usados en el template
import { Trophy, X } from 'lucide-vue-next';

const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const progress = ref(0); // Ejemplo: 0/10
</script>

<template>
  <div class="master-container">
    <main class="app-canvas">
      
      <header class="header-standard shrink-0">
        <div class="trophy-section flex items-center gap-2">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule">
          <div class="loot-item">
            <img src="/images/coin-gold.png" alt="Oro" />
            <span class="font-bold text-slate-700">{{ sessionCoins.gold }}</span>
          </div>
          <div class="loot-item border-x border-slate-200">
            <img src="/images/coin-silver.png" alt="Plata" />
            <span class="font-bold text-slate-700">{{ sessionCoins.silver }}</span>
          </div>
          <div class="loot-item">
            <img src="/images/coin-copper.png" alt="Cobre" />
            <span class="font-bold text-slate-700">{{ sessionCoins.copper }}</span>
          </div>
        </div>

        <button class="btn-close-circle p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
          <X size="20" stroke-width="2.5" />
        </button>
      </header>

      <div class="game-content flex-1 flex flex-col items-center justify-between py-2 w-full">
        
        <h1 class="game-title mt-2 text-center px-4">TÍTULO DEL JUEGO</h1>
        
        <div class="main-visual-area flex-1 flex items-center justify-center w-full min-h-0 relative">
            </div>

        <div class="rules-panel shrink-0 mx-auto">
          <div class="rules-badge shadow-md">REGLAS</div>
          <div class="rules-grid text-sm font-medium text-slate-600">
             Aquí van las instrucciones del nivel. El texto se adaptará sin romper la pantalla.
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
/* CONTENEDOR MAESTRO (FONDO PANTALLA) */
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9; 
  overflow: hidden;
  /* 🛠️ FIX: Eliminado touch-action: none de aquí para no bloquear la app entera */
}

/* LIENZO DE LA APP (CANVAS) */
.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #f8fafc;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  /* 🛠️ FIX: Uso seguro para móviles con notch/cámaras integradas */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);

  /* Dimensiones base (Mobile First) */
  width: 100vw;
  height: 100dvh;
  /* 🛠️ FIX: Si la pantalla es enana, permitimos scroll interno seguro */
  overflow-y: auto; 
  overflow-x: hidden;
}

/* ADAPTACIÓN PROGRESIVA */
@media (min-width: 1025px) {
  .app-canvas {
    width: 1024px; /* REGLA MAESTRA PC */
    height: 90dvh;
    border-radius: 45px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.15);
    border: 8px solid white;
    /* En PC anulamos el padding del safe-area porque no hay notch */
    padding: 0; 
    overflow: hidden; 
  }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { 
    width: 85vw; 
    /* 🛠️ FIX: Tope máximo para que no se estire de forma grotesca en iPad Pro apaisado */
    max-width: 800px; 
    height: 95dvh; 
    border-radius: 35px; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    padding: 0;
  }
}

/* ESTILOS DE COMPONENTES HOMOLOGADOS */
.header-standard {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 2px solid #f1f5f9;
}

.session-loot-capsule {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 9999px;
  border: 2px solid #e2e8f0;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}

.loot-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.loot-item img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain; 
}

.game-title {
  /* 🛠️ FIX: Tipografía fluida. Crece y decrece según el ancho de la pantalla automáticamente */
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 900;
  color: #312e81;
  text-transform: uppercase;
  font-style: italic; 
  letter-spacing: -0.02em;
}

.rules-panel {
  width: 92%;
  max-width: 600px; /* 🛠️ FIX: Evita que sea gigante en PC */
  background: white;
  padding: 1.2rem 1rem 1rem 1rem;
  border-radius: 1.5rem;
  border: 2px solid #e2e8f0;
  position: relative;
  margin-bottom: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
}

.rules-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%); /* 🛠️ FIX: Centrado para mejor estética móvil */
  background: #4f46e5;
  color: white;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 14px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

/* Ocultar barra de scroll para limpieza estética, pero manteniendo funcionalidad */
.app-canvas::-webkit-scrollbar {
  display: none;
}
.app-canvas {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>