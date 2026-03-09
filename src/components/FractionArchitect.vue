<script setup>
/** * ARCHIVO: FractionArchitect.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + BOTONES 3D RELIEVE + 3 REGLAS
 * LOGICA: 3 Niveles Progresivos (Aprendiz, Chef, Maestro) con inyección atómica.
 */

import { ref, computed, watch, onMounted } from 'vue';
import { X, Trophy, Star, ChefHat, CheckCircle2, PlayCircle, Pizza, Info, Plus, Minus, Coins, RotateCcw, Utensils } from 'lucide-vue-next';
import { gsap } from 'gsap'; 
import { useGamificationStore } from '@/stores/useGamificationStore';
import CoinRain from './CoinRain.vue';

const emit = defineEmits(['close']);
const store = useGamificationStore(); 

// --- 1. SISTEMA DE RECOMPENSAS EN TIEMPO REAL ---
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });
const totalErrors = ref(0);

// --- 2. ESTADO DEL JUEGO Y FLUJO ---
const gameState = ref('rules'); 
const currentLevel = ref(1);
const totalLevels = 10;
const isVictoryLevel = ref(false); 

// --- 3. LÓGICA DE FRACCIONES ---
const targetNumerator = ref(1);
const targetDenominator = ref(2);
const activeCuts = ref(2); 
const requiredSlicesToWin = ref(1); 
const selectedSlices = ref(0); 
const usedExercises = ref([]);

const gamePhase = computed(() => {
  if (currentLevel.value <= 4) return 1;
  if (currentLevel.value <= 7) return 2;
  return 3;
});

const levelTitle = computed(() => {
  if (gamePhase.value === 1) return 'NIVEL 1: APRENDIZ';
  if (gamePhase.value === 2) return 'NIVEL 2: CHEF (Equivalencias)';
  return 'NIVEL 3: MAESTRO (Sumas)';
});

const levelBadgeColor = computed(() => {
  if (gamePhase.value === 1) return 'text-orange-700 bg-orange-100';
  if (gamePhase.value === 2) return 'text-blue-700 bg-blue-100';
  return 'text-purple-700 bg-purple-100';
});

const instructionText = computed(() => {
  if (gamePhase.value === 1) return `Representa la fracción indicada colocando exactamente ${requiredSlicesToWin.value} porciones en la pizza.`;
  if (gamePhase.value === 2) return `¡Aprendamos equivalencias! Aunque ves ${activeCuts.value} cortes, la fracción ${targetNumerator.value}/${targetDenominator.value} ocupa el mismo espacio. ¡Coloca ${requiredSlicesToWin.value} porciones!`;
  if (gamePhase.value === 3) return `¡Maestría en sumas! Para resolver ${fractionName.value}, necesitamos juntar todas las partes. El total son ${requiredSlicesToWin.value} porciones. ¡A cocinar!`;
  return '';
});

const fractionName = computed(() => {
  const numeradores = ["", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];
  const denominadores = { 2: "medio", 3: "tercio", 4: "cuarto", 5: "quinto", 6: "sexto", 8: "octavo" };
  const num = numeradores[targetNumerator.value] || targetNumerator.value;
  let den = denominadores[targetDenominator.value];
  if (targetNumerator.value > 1) den = den === "tercio" ? "tercios" : den + "s";
  if (gamePhase.value === 3) {
      if (targetNumerator.value === 1 && targetDenominator.value === 2) return "1/4 + 1/4";
      if (targetNumerator.value === 3 && targetDenominator.value === 4) return "1/2 + 1/4";
      if (targetNumerator.value === 1 && targetDenominator.value === 1) return "1/2 + 1/2";
  }
  return `${num} ${den}`;
});

const pizzaStyles = [
  { cheese: '#FFFAED', sauce: '#E63946' }, 
  { cheese: '#FFF8E1', sauce: '#B71C1C' },
  { cheese: '#FFFDF0', sauce: '#2D6A4F' }
];
const currentPizzaStyle = computed(() => pizzaStyles[(currentLevel.value - 1) % 3]);

const playSound = (name) => {
  const audio = new Audio(`/audios/${name}.mp3`);
  audio.play().catch(() => {});
};

const getSlicePath = (n) => {
  const startAngle = (2 * Math.PI * (n - 1)) / activeCuts.value;
  const endAngle = (2 * Math.PI * n) / activeCuts.value;
  const x1 = 50 + 45 * Math.cos(startAngle);
  const y1 = 50 + 45 * Math.sin(startAngle);
  const x2 = 50 + 45 * Math.cos(endAngle);
  const y2 = 50 + 45 * Math.sin(endAngle);
  return `M 50 50 L ${x1} ${y1} A 45 45 0 0 1 ${x2} ${y2} Z`;
};

const generateNewOrder = () => {
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 20) {
    attempts++;
    if (gamePhase.value === 1) {
      const denoms = [2, 3, 4, 6];
      targetDenominator.value = denoms[Math.floor(Math.random() * denoms.length)];
      targetNumerator.value = Math.floor(Math.random() * (targetDenominator.value - 1)) + 1;
      activeCuts.value = targetDenominator.value;
      requiredSlicesToWin.value = targetNumerator.value;
    } else if (gamePhase.value === 2) {
      const eq = [{ n: 1, d: 2, c: 4, r: 2 }, { n: 1, d: 2, c: 8, r: 4 }, { n: 1, d: 4, c: 8, r: 2 }][Math.floor(Math.random() * 3)];
      targetNumerator.value = eq.n; targetDenominator.value = eq.d;
      activeCuts.value = eq.c; requiredSlicesToWin.value = eq.r;
    } else {
      const sums = [{ n: 1, d: 2, c: 8, r: 4 }, { n: 3, d: 4, c: 8, r: 6 }, { n: 1, d: 1, c: 8, r: 8 }];
      const s = sums[Math.floor(Math.random() * sums.length)];
      targetNumerator.value = s.n; targetDenominator.value = s.d;
      activeCuts.value = s.c; requiredSlicesToWin.value = s.r;
    }
    const key = `F${gamePhase.value}-${targetNumerator.value}/${targetDenominator.value}`;
    if (!usedExercises.value.includes(key)) { usedExercises.value.push(key); isUnique = true; }
  }
};

const startGame = () => {
  gameState.value = 'playing';
  sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
  currentLevel.value = 1;
  totalErrors.value = 0;
  selectedSlices.value = 0;
  isVictoryLevel.value = false;
  usedExercises.value = [];
  generateNewOrder();
};

const addSlice = () => {
  if (isVictoryLevel.value || selectedSlices.value >= activeCuts.value) return;
  selectedSlices.value++;
  playSound('pop'); 
};

const removeSlice = () => {
  if (selectedSlices.value > 0 && !isVictoryLevel.value) {
    selectedSlices.value--;
    playSound('pop'); 
  }
};

watch(selectedSlices, (newVal) => {
  if (newVal === requiredSlicesToWin.value && !isVictoryLevel.value) {
    isVictoryLevel.value = true;
    playSound('correct1'); 
    if (gamePhase.value === 1) sessionCoins.value.copper++;
    else if (gamePhase.value === 2) sessionCoins.value.silver++;
    else sessionCoins.value.gold++;

    setTimeout(() => {
      if (currentLevel.value < totalLevels) {
        currentLevel.value++;
        generateNewOrder();
        selectedSlices.value = 0;
        isVictoryLevel.value = false;
      } else { finishGame(); }
    }, 1500); 
  }
});

const finishGame = async () => {
  gameState.value = 'finished';
  await store.addMultipleCoins({...sessionCoins.value});
  await store.updateMissionProgress('complete_challenge', 1);
  playSound('finish1'); playSound('coins');
};

onMounted(() => generateNewOrder());
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-smartphone">
      
      <header v-if="gameState === 'playing'" class="header-standard shrink-0">
        <div class="trophy-section">
          <Trophy size="22" class="text-yellow-500" />
          <span class="text-xl font-black text-indigo-900">{{ currentLevel }}/10</span>
        </div>
        <div class="session-loot-capsule">
          <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
          <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
          <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
        </div>
        <button @click="gameState = 'rules'" class="btn-close-circle"><X size="20" /></button>
      </header>

      <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 bg-slate-50 overflow-y-auto relative animate-fade-in">
        <button @click="emit('close')" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all z-50">
          <X size="24" stroke-width="3" />
        </button>

        <div class="flex flex-col items-center mt-6">
          <ChefHat size="60" class="text-orange-600 animate-bounce mb-2" />
          <h1 class="game-title text-4xl uppercase font-black italic text-indigo-950">Pizza Architect</h1>
        </div>

        <div class="rules-panel shadow-2xl w-full">
          <div class="rules-badge uppercase tracking-widest font-black">Manual del Chef</div>
          <div class="p-5 space-y-6">
            <div class="flex gap-4 items-start">
              <div class="bg-orange-100 p-2 rounded-lg shrink-0"><Pizza class="text-orange-600" size="24" /></div>
              <div>
                <p class="text-[15px] font-black text-slate-800">Hornea la Fracción</p>
                <p class="text-xs font-medium text-slate-500 leading-snug">Mira el pedido y coloca la cantidad de porciones exacta sobre la masa.</p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div class="bg-blue-100 p-2 rounded-lg shrink-0"><Utensils class="text-blue-600" size="24" /></div>
              <div>
                <p class="text-[15px] font-black text-slate-800">Equivalencias</p>
                <p class="text-xs font-medium text-slate-500 leading-snug">¡Cuidado! A veces cortamos la pizza en más trozos de los que pide la fracción base.</p>
              </div>
            </div>
            <div class="flex gap-4 items-start">
              <div class="bg-green-100 p-2 rounded-lg shrink-0"><Coins class="text-green-600" size="24" /></div>
              <div>
                <p class="text-[15px] font-black text-slate-800">Gana Botín Real</p>
                <p class="text-xs font-medium text-slate-500 leading-snug">Cada pizza perfecta suma monedas directamente a tu sesión actual.</p>
              </div>
            </div>
          </div>
        </div>

        <button @click="startGame" class="btn-action-primary group">
            <span class="flex items-center">
                ¡EMPEZAR A COCINAR! <PlayCircle class="ml-3 group-hover:rotate-12 transition-transform" size="26" />
            </span>
        </button>
      </div>

      <div v-else-if="gameState === 'playing'" class="game-content flex-1 flex flex-col items-center justify-between p-4 bg-[#FDF6E3]">
        <div class="px-5 py-1.5 rounded-full text-xs font-black shadow-sm border border-white/60 uppercase tracking-widest" :class="levelBadgeColor">{{ levelTitle }}</div>

        <div class="w-full flex justify-center mt-2">
          <div class="bg-sky-50 border border-sky-200 p-3 rounded-2xl shadow-sm flex items-center gap-3 w-full">
            <div class="text-2xl shrink-0">🦉</div>
            <p class="text-sky-900 text-xs font-bold leading-tight tracking-tight">{{ instructionText }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full justify-center my-2">
          <div class="p-3 rounded-[20px] shadow-lg border-4 text-center min-w-[95px] bg-white border-orange-200">
            <span class="text-4xl font-black text-orange-600 block leading-none">{{ targetNumerator }}</span>
            <div class="w-8 h-1 bg-slate-800 my-1 rounded-full mx-auto"></div>
            <span class="text-4xl font-black text-slate-800 block leading-none">{{ targetDenominator }}</span>
          </div>
          <div class="bg-white border-4 border-orange-100 p-3 rounded-[20px] shadow-lg flex-1 max-w-[180px] min-h-[90px] flex items-center justify-center">
            <p class="text-orange-900 font-black text-lg uppercase italic text-center leading-tight">{{ fractionName }}</p>
          </div>
        </div>

        <div class="relative w-64 h-64 pizza-container flex items-center justify-center">
          <div class="absolute inset-0 rounded-full shadow-2xl border-[12px] border-[#C08240] bg-[#F3E5AB]"></div>
          <svg viewBox="0 0 100 100" class="w-56 h-56 rotate-[-90deg] z-10 drop-shadow-lg transition-all duration-500">
             <circle cx="50" cy="50" r="45" :fill="currentPizzaStyle.cheese" />
             <g v-for="n in selectedSlices" :key="n">
                <path :d="getSlicePath(n)" :fill="currentPizzaStyle.sauce" stroke="white" stroke-width="0.3" />
             </g>
             <line v-for="n in activeCuts" :key="'g'+n" x1="50" y1="50" :x2="50 + 45 * Math.cos(2 * Math.PI * n / activeCuts)" :y2="50 + 45 * Math.sin(2 * Math.PI * n / activeCuts)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />
          </svg>
        </div>

        <div class="w-full bg-white/90 p-5 rounded-t-[40px] border-t-2 border-slate-100 flex justify-center items-center gap-10 shadow-2xl">
          <button @click="removeSlice" class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-lg active:scale-75 border-2 border-red-200">
            <Minus class="text-red-500" size="32" stroke-width="4" />
          </button>
          <button @click="addSlice" class="w-22 h-22 bg-orange-500 rounded-tr-[80%] rounded-bl-3xl border-4 border-orange-700 shadow-[0_8px_0_rgb(154,52,18)] active:translate-y-2 flex items-center justify-center">
            <Plus class="text-white" size="48" stroke-width="4" />
          </button>
          <button @click="selectedSlices = 0" class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200 active:scale-90 transition-transform">
            <RotateCcw class="text-slate-400" :size="28" />
          </button>
        </div>

        <div v-if="isVictoryLevel" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none">
          <div class="bg-green-500 text-white px-10 py-4 rounded-3xl font-black text-4xl shadow-2xl animate-pop-in uppercase italic border-4 border-white">¡RIQUÍSIMO!</div>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col items-center justify-center p-6 bg-indigo-900 text-center text-white uppercase italic">
        <CoinRain type="gold" />
        <Trophy size="100" class="text-amber-400 mb-6 animate-bounce" />
        <h2 class="text-4xl font-black mb-10 tracking-tighter">¡CHEF SUPREMO!</h2>
        
        <div class="prize-card-large w-full bg-white/10 p-8 rounded-[3rem] flex justify-around mb-12 border border-white/20">
           <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-12 h-12 mb-1" /><span class="text-2xl font-black">+{{ sessionCoins.gold }}</span></div>
           <div class="flex flex-col items-center border-x border-white/10 px-6"><img src="/images/coin-silver.png" class="w-12 h-12 mb-1" /><span class="text-2xl font-black">+{{ sessionCoins.silver }}</span></div>
           <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-12 h-12 mb-1" /><span class="text-2xl font-black">+{{ sessionCoins.copper }}</span></div>
        </div>
        
        <div class="w-full space-y-4">
          <button @click="emit('close')" class="btn-action-finish">TERMINAR</button>
          <button @click="startGame" class="w-full bg-white/10 py-4 rounded-2xl font-black text-lg border-2 border-white/20 active:translate-y-1 transition-all">REPETIR RETO</button>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; font-family: 'Inter', sans-serif !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background-color: #f8fafc; transition: all 0.4s; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); border: 8px solid white; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.loot-item span { font-weight: 900; color: #312e81; font-size: 1rem; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.rules-panel { background: white; border-radius: 2.5rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

/* BOTÓN REDUCIDO QUIRÚRGICAMENTE Y CON RELIEVE 3D */
.btn-action-primary {
  background: linear-gradient(to bottom, #22c55e, #16a34a);
  color: white;
  padding: 1rem 2.2rem; /* Tamaño reducido de 1.4/2.8 a 1/2.2 */
  border-radius: 2rem;
  font-weight: 900;
  font-size: 1.25rem; /* Tamaño de fuente reducido de 1.5 a 1.25 */
  font-style: italic;
  border: none;
  border-bottom: 8px solid #15803d; /* Relieve reducido ligeramente */
  box-shadow: 0 8px 18px rgba(22, 163, 74, 0.4);
  transition: all 0.1s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  max-width: 420px;
}
.btn-action-primary:active {
  transform: translateY(4px); /* Se hunde menos al pulsar */
  border-bottom: 4px solid #15803d;
  box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
}

.btn-action-finish { 
  background: #f59e0b; color: white; width: 100%; padding: 1.2rem; 
  border-radius: 1.5rem; font-weight: 900; font-size: 22px; 
  border: none; border-bottom: 10px solid #b45309; 
  transition: transform 0.1s; 
}
.btn-action-finish:active { transform: translateY(6px); border-bottom-width: 4px; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>