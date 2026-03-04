<script setup>
import { ref, onMounted, watch } from 'vue';
// 🚀 UNIFICACIÓN: Usamos el alias @ para conectar con el Banco Central exacto
import { useGamificationStore } from '@/stores/useGamificationStore';
import { storeToRefs } from 'pinia';
import { playCoinSound } from '@/utils/sound';
import CoinRain from './CoinRain.vue';

// Conectamos con el Banco
const store = useGamificationStore();
// Extraemos los saldos REALES con reactividad total
const { copper, silver, gold } = storeToRefs(store);

// Variables para controlar la celebración
const showRain = ref(false);
const rainType = ref('copper'); 

// Valores de visualización para la animación numérica
const displayCopper = ref(0);
const displaySilver = ref(0);
const displayGold = ref(0);

/**
 * Función de animación suave con Easing
 * Asegura que los números suban o bajen con fluidez visual.
 */
const animateValue = (start, end, duration, elementRef) => {
  if (start === end) {
      elementRef.value = end;
      return;
  }
  
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
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
    // 1. Sincronización inicial: Animamos desde 0 al saldo actual del Banco
    animateValue(0, gold.value, 1500, displayGold);
    animateValue(0, silver.value, 1500, displaySilver);
    animateValue(0, copper.value, 1500, displayCopper);

    // 2. VIGILANTE DE PREMIOS (Celebración de sesión)
    const earnedGold = store.sessionGoldEarned || 0;
    const earnedSilver = store.sessionSilverEarned || 0;
    const earnedCopper = store.sessionCopperEarned || 0;
    
    const currentSessionTotal = earnedGold + earnedSilver + earnedCopper;
    const lastCelebrated = parseInt(sessionStorage.getItem('lastCelebratedTotal') || '0');

    if (currentSessionTotal > 0 && currentSessionTotal > lastCelebrated) {
        sessionStorage.setItem('lastCelebratedTotal', currentSessionTotal.toString());

        if (earnedGold > 0) rainType.value = 'gold';
        else if (earnedSilver > 0) rainType.value = 'silver';
        else rainType.value = 'copper';

        showRain.value = true;
        
        setTimeout(() => {
            playCoinSound();
        }, 100);

        setTimeout(() => {
            showRain.value = false;
        }, 4000);

    } else if (currentSessionTotal === 0) {
        sessionStorage.setItem('lastCelebratedTotal', '0');
    }
});

// 🔄 VIGILANTES REACTIVOS: Si el Banco Central cambia, el tablero se actualiza solo
watch(copper, (newVal, oldVal) => animateValue(oldVal, newVal, 500, displayCopper));
watch(silver, (newVal, oldVal) => animateValue(oldVal, newVal, 500, displaySilver));
watch(gold, (newVal, oldVal) => animateValue(oldVal, newVal, 500, displayGold));

</script>

<template>
  <div class="status-board">
    
    <CoinRain v-if="showRain" :type="rainType" :count="25" />

    <div class="coin-stat gold">
      <img src="/images/coin-gold.png" alt="Oro" class="coin-icon" />
      <span class="count">{{ displayGold }}</span>
    </div>

    <div class="coin-stat silver">
      <img src="/images/coin-silver.png" alt="Plata" class="coin-icon" />
      <span class="count">{{ displaySilver }}</span>
    </div>

    <div class="coin-stat copper">
      <img src="/images/coin-copper.png" alt="Cobre" class="coin-icon" />
      <span class="count">{{ displayCopper }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-board {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 14px 10px 4px 10px; 
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 2px solid #f0f0f0;
  width: 100%;
}

.coin-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex-shrink: 0;
}

.coin-icon {
  width: 58px; 
  height: 58px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
  transition: transform 0.2s;
  z-index: 1;
}

.coin-stat:hover .coin-icon {
  transform: scale(1.1) rotate(5deg);
}

.count {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1.15rem;
  color: #444;
  margin-top: 8px; 
  background: white;
  padding: 1px 12px;
  border-radius: 12px;
  border: 2px solid #eee;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-width: 42px; 
  text-align: center;
}

.gold .count { color: #d4af37; border-color: #d4af37; }
.silver .count { color: #8e8e93; border-color: #a8a9ad; }
.copper .count { color: #b87333; border-color: #b87333; }
</style>