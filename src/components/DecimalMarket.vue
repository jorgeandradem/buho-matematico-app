<script setup>
import { ref, computed } from 'vue';
import { Trophy, X, ChevronRight, ShoppingCart, Banknote, RotateCcw, Home } from 'lucide-vue-next';
import { useGamificationStore } from '@/stores/useGamificationStore';

const gamification = useGamificationStore();
const currentStep = ref(1); // 1: Reglas, 2: Juego, 3: Premios
const progress = ref(0);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// Lógica de dificultad: Monedas de sesión según avance 
const difficulty = computed(() => {
  if (progress.value < 5) return 'copper';
  if (progress.value < 8) return 'silver';
  return 'gold';
});

// Datos del reto actual Mercado de decimales
const itemPrice = ref(0.75);
const paidWith = ref(1.00);
const userChange = ref(0);

const handleCorrect = () => {
  if (difficulty.value === 'copper') sessionCoins.value.copper += 1;
  else if (difficulty.value === 'silver') sessionCoins.value.silver += 1;
  else sessionCoins.value.gold += 1;

  if (progress.value < 9) {
    progress.value++;
    // Generar nuevo precio aleatorio aquí
  } else {
    progress.value = 10;
    finishGame();
  }
};

const finishGame = () => {
  gamification.addCoins('copper', sessionCoins.value.copper);
  gamification.addCoins('silver', sessionCoins.value.silver);
  gamification.addCoins('gold', sessionCoins.value.gold);
  currentStep.value = 3;
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas steampunk-bg">
      
      <header class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-600" />
          <span class="text-xl font-black text-amber-900">{{ progress }}/10</span>
        </div>

        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-amber-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>

        <button @click="currentStep === 1 ? $emit('close') : currentStep = 1" class="btn-close-circle">
          <X size="20" />
        </button>
      </header>

      <section v-if="currentStep === 1" class="game-content animate-fade-in">
        <h1 class="game-title">Mercado de Decimales</h1>
        <div class="rules-panel shadow-xl">
          <div class="rules-badge">INSTRUCCIONES DE LA BOVEDA</div>
          <div class="rules-grid p-4 space-y-4">
            <div class="flex items-center gap-4">
              <div class="icon-gear"><ShoppingCart class="text-amber-700" /></div>
              <p class="text-sm">Mira el precio en el recibo de vapor.</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="icon-gear"><Banknote class="text-emerald-700" /></div>
              <p class="text-sm">Completa el "Rompecabezas del 100" para dar el cambio exacto.</p>
            </div>
          </div>
        </div>
        <button @click="currentStep = 2" class="btn-steampunk"> ABRIR CAJA FUERTE <ChevronRight /> </button>
      </section>

      <section v-if="currentStep === 2" class="game-content">
        <div class="register-machine">
          <div class="thermal-receipt">
            <p class="font-mono text-xs text-slate-500 text-center">BUHO-MART 2026</p>
            <div class="flex justify-between font-mono font-bold mt-2">
              <span>TOTAL:</span> <span>${{ itemPrice.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-mono text-blue-600">
              <span>PAGO:</span> <span>${{ paidWith.toFixed(2) }}</span>
            </div>
            <hr class="border-dashed border-slate-300 my-1">
            <div class="flex justify-between font-mono text-red-600 bg-red-50 p-1">
              <span>CAMBIO:</span> <span>?</span>
            </div>
          </div>

          <div class="coin-drawer" @click="handleCorrect">
             <div class="coin-slot">0.50</div>
             <div class="coin-slot">0.25</div>
             <div class="coin-slot">0.10</div>
             <div class="coin-slot">0.05</div>
          </div>
        </div>
      </section>

      <section v-if="currentStep === 3" class="game-content result-screen">
        <h1 class="game-title">¡NEGOCIO REDONDO!</h1>
        <div class="final-loot-display">
            <div class="loot-big gold-glow"><img src="/images/coin-gold.png" /> <span>+{{ sessionCoins.gold }}</span></div>
            <div class="loot-big silver-glow"><img src="/images/coin-silver.png" /> <span>+{{ sessionCoins.silver }}</span></div>
            <div class="loot-big copper-glow"><img src="/images/coin-copper.png" /> <span>+{{ sessionCoins.copper }}</span></div>
        </div>
        <div class="action-buttons">
          <button @click="currentStep = 1" class="btn-secondary"> <RotateCcw /> Otra Racha </button>
          <button @click="$emit('close')" class="btn-primary-owl"> <Home /> Al Portal </button>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
.steampunk-bg {
  background: #fdf5e6;
  background-image: radial-gradient(#d2b48c 1px, transparent 1px);
  background-size: 20px 20px;
}

.icon-gear {
  background: #e2e8f0; border: 2px solid #b45309;
  padding: 10px; border-radius: 50%;
}

.register-machine {
  background: #78350f; padding: 20px; border-radius: 20px;
  border: 8px solid #451a03; box-shadow: 0 20px 0 #271102;
  width: 300px;
}

.thermal-receipt {
  background: white; padding: 15px; border-radius: 4px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
  transform: translateY(-5px) rotate(-1deg);
}

.coin-drawer {
  margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.coin-slot {
  background: #b45309; color: gold; font-weight: 900;
  padding: 15px; border-radius: 10px; text-align: center;
  border-bottom: 4px solid #78350f; cursor: pointer;
}

.btn-steampunk {
  background: #b45309; color: white; padding: 1.2rem 2rem;
  border-radius: 12px; font-weight: 900; border: none;
  box-shadow: 0 6px 0 #78350f;
}

/* Efectos de brillo para premios */
.gold-glow { filter: drop-shadow(0 0 8px #fbbf24); }
.silver-glow { filter: drop-shadow(0 0 8px #94a3b8); }
.copper-glow { filter: drop-shadow(0 0 8px #b45309); }
</style>