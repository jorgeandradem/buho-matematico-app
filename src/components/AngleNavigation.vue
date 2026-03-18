<script setup>
import { ref, computed } from 'vue';
import { Trophy, X, Compass, Anchor, RotateCcw, Home, MoveUpRight } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const gamification = useGamificationStore();
const currentStep = ref(1); 
const progress = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const currentAngleGoal = ref(90); // El Búho pide 90°
const currentRotation = ref(0); // Rotación real del timón

const checkAngle = () => {
  // Margen de error de 5 grados para que no sea frustrante  NAVEGACION DE ANGULOS
  if (Math.abs(currentRotation.value - currentAngleGoal.value) < 5) {
    handleCorrect();
  }
};

const handleCorrect = () => {
  if (progress.value < 5) sessionCoins.value.copper++;
  else if (progress.value < 8) sessionCoins.value.silver++;
  else sessionCoins.value.gold++;

  if (progress.value < 9) {
    progress.value++;
    // Lógica para cambiar el ángulo solicitado
  } else {
    progress.value = 10;
    currentStep.value = 3;
    saveRewards();
  }
};

const saveRewards = () => {
  gamification.addCoins('copper', sessionCoins.value.copper);
  gamification.addCoins('silver', sessionCoins.value.silver);
  gamification.addCoins('gold', sessionCoins.value.gold);
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas ocean-bg">
      
      <header class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-blue-600" />
          <span class="text-xl font-black text-blue-900">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-blue-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>

        <button @click="currentStep === 1 ? $emit('close') : currentStep = 1" class="btn-close-circle">
          <X size="20" />
        </button>
      </header>

      <section v-if="currentStep === 1" class="game-content">
        <h1 class="game-title">Navegación de Ángulos</h1>
        <div class="rules-panel">
          <div class="rules-badge">BITÁCORA DEL CAPITÁN</div>
          <div class="rules-grid p-4 text-left space-y-3">
             <p>⚓ **90°:** Una "L" perfecta (Ángulo Recto).</p>
             <p>🍕 **45°:** Un corte de pizza (Ángulo Agudo).</p>
             <p>🌏 **180°:** Media vuelta al mundo (Ángulo Llano).</p>
          </div>
        </div>
        <button @click="currentStep = 2" class="btn-ocean"> ¡A TODA VELA! </button>
      </section>

      <section v-if="currentStep === 2" class="game-content overflow-hidden">
        <div class="sea-area">
          <div class="compass-overlay">
            <Compass :size="200" class="text-white/20 animate-pulse" />
          </div>
          
          <div class="instruction-banner">
            ¡Gira a un ángulo <strong>RECTO</strong> (90°)!
          </div>

          <div class="rudder-container">
            <div class="rudder-wheel" :style="{ transform: `rotate(${currentRotation}deg)` }" @click="currentRotation += 45; checkAngle()">
              <div class="rudder-handle"></div>
              <Anchor class="text-amber-900/50" :size="60" />
            </div>
          </div>
        </div>
      </section>

      <section v-if="currentStep === 3" class="game-content result-screen">
         <h1 class="game-title">¡TIERRA A LA VISTA!</h1>
         <button @click="$emit('close')" class="btn-primary-owl">VOLVER AL PUERTO</button>
      </section>

    </main>
  </div>
</template>

<style scoped>
.ocean-bg {
  background: linear-gradient(to bottom, #0ea5e9, #0369a1);
}

.sea-area {
  position: relative; height: 100%; width: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

.instruction-banner {
  background: white; padding: 10px 20px; border-radius: 9999px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-size: 1.2rem; margin-bottom: 40px;
}

.rudder-wheel {
  width: 240px; height: 240px;
  background: #78350f; border: 15px solid #451a03;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.rudder-handle {
  position: absolute; width: 20px; height: 300px;
  background: repeating-linear-gradient(#78350f, #451a03 20%);
  z-index: -1; border-radius: 10px;
}

.btn-ocean {
  background: #f59e0b; color: white; padding: 1.2rem 3rem;
  border-radius: 9999px; font-weight: 900;
  box-shadow: 0 6px 0 #b45309;
}
</style>