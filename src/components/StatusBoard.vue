<script setup>
/** * ARCHIVO: StatusBoard.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v3.0.0 + ANIMACIONES REACTIVAS CORREGIDAS
 * LOGICA: Visualización reactiva de saldos con animación de conteo suave.
 */
import { ref, onMounted, watch } from 'vue';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { storeToRefs } from 'pinia';
import { playCoinSound } from '@/utils/sound';
import CoinRain from './CoinRain.vue';

const store = useGamificationStore();
// storeToRefs garantiza que el tablero "escuche" al Banco Central en tiempo real
const { copper, silver, gold } = storeToRefs(store);

const showRain = ref(false);
const rainType = ref('copper'); 

// Variables para la animación visual (lo que el usuario ve)
const displayCopper = ref(0);
const displaySilver = ref(0);
const displayGold = ref(0);

/**
 * 🛠️ FIX: Función elevada al Scope Global del componente.
 * Animación quirúrgica con Easing Out Cubic.
 */
const animateValue = (startVal, endVal, duration, elementRef) => {
  const start = parseInt(startVal) || 0;
  const end = parseInt(endVal) || 0;
  
  if (start === end) {
      elementRef.value = end;
      return;
  }
  
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Easing Out Cubic para suavidad premium
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    elementRef.value = Math.floor(easeProgress * (end - start) + start);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      elementRef.value = end; 
    }
  };
  
  window.requestAnimationFrame(step);
};

onMounted(() => {
    // 1. Sincronización de entrada: Del estado actual a la visualización
    animateValue(0, gold.value, 1000, displayGold);
    animateValue(0, silver.value, 1000, displaySilver);
    animateValue(0, copper.value, 1000, displayCopper);

    // 2. Vigilante de Celebración (Protocolo de Sesión)
    const earnedGold = store.sessionGoldEarned || 0;
    const earnedSilver = store.sessionSilverEarned || 0;
    const earnedCopper = store.sessionCopperEarned || 0;
    
    const currentSessionTotal = earnedGold + earnedSilver + earnedCopper;
    const lastCelebrated = parseInt(sessionStorage.getItem('lastCelebratedTotal') || '0');

    if (currentSessionTotal > 0 && currentSessionTotal > lastCelebrated) {
        sessionStorage.setItem('lastCelebratedTotal', currentSessionTotal.toString());

        // Prioridad de lluvia por valor de moneda
        if (earnedGold > 0) rainType.value = 'gold';
        else if (earnedSilver > 0) rainType.value = 'silver';
        else rainType.value = 'copper';

        showRain.value = true;
        playCoinSound();

        setTimeout(() => { showRain.value = false; }, 4000);

    } else if (currentSessionTotal === 0) {
        sessionStorage.setItem('lastCelebratedTotal', '0');
    }
});

// 🔄 VIGILANTES REACTIVOS GLOBALES
// Ahora sí pueden llamar a animateValue sin causar errores ocultos en consola
watch(copper, (newVal, oldVal) => {
    animateValue(oldVal || 0, newVal, 600, displayCopper);
});

watch(silver, (newVal, oldVal) => {
    animateValue(oldVal || 0, newVal, 600, displaySilver);
});

watch(gold, (newVal, oldVal) => {
    animateValue(oldVal || 0, newVal, 600, displayGold);
});

</script>

<template>
  <div class="status-board-container">
    
    <CoinRain v-if="showRain" :type="rainType" :count="30" />

    <div class="board-inner shadow-2xl">
      <div class="coin-stat-box gold-theme">
        <div class="icon-wrapper">
          <img src="/images/coin-gold.png" alt="Oro" class="coin-img" />
        </div>
        <div class="count-badge">{{ displayGold }}</div>
      </div>

      <div class="coin-stat-box silver-theme">
        <div class="icon-wrapper">
          <img src="/images/coin-silver.png" alt="Plata" class="coin-img" />
        </div>
        <div class="count-badge">{{ displaySilver }}</div>
      </div>

      <div class="coin-stat-box copper-theme">
        <div class="icon-wrapper">
          <img src="/images/coin-copper.png" alt="Cobre" class="coin-img" />
        </div>
        <div class="count-badge">{{ displayCopper }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-board-container {
  width: 100%;
  padding: 10px;
  display: flex;
  justify-content: center;
  z-index: 100;
}

.board-inner {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 30px;
  border: 3px solid #f1f5f9;
  width: 100%;
  max-width: 450px;
}

.coin-stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.icon-wrapper {
  position: relative;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.coin-img {
  width: 52px;
  height: 52px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
}

.coin-stat-box:hover .icon-wrapper {
  transform: scale(1.15) rotate(10deg);
}

.count-badge {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
  font-size: 1.2rem;
  padding: 2px 14px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  min-width: 50px;
  text-align: center;
  border: 2px solid #e2e8f0;
}

/* Colores de Marca por Metal */
.gold-theme .count-badge { color: #b45309; border-color: #fbbf24; background: #fffbeb; }
.silver-theme .count-badge { color: #475569; border-color: #94a3b8; background: #f8fafc; }
.copper-theme .count-badge { color: #9a3412; border-color: #fb923c; background: #fff7ed; }

/* Animación de entrada */
.animate-ping-once {
  animation: ping 0.5s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes ping {
  75%, 100% { transform: scale(1.2); opacity: 0; }
}
</style>