<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm overscroll-none touch-none">
    
    <div class="relative w-full max-w-[480px] h-[100dvh] flex flex-col overflow-hidden shadow-2xl bg-white mx-auto" 
          :style="{ backgroundColor: currentChallenge?.color + '11' }">
      
      <header class="grid grid-cols-[1.1fr_auto_1.1fr] items-stretch p-3 bg-white shadow-md shrink-0 z-40 relative gap-2">
        <div class="relative flex items-center gap-1 bg-slate-100 p-1 rounded-full w-fit h-full">
          <transition name="float">
            <div v-if="floatingPoints" class="absolute -top-10 left-1/2 -translate-x-1/2 text-green-600 font-black text-2xl z-50 pointer-events-none">
              +{{ currentReward }}
            </div>
          </transition>
          <button v-for="coin in ['gold', 'silver', 'copper']" :key="coin" 
                  @click="setDifficulty(coin)" 
                  :class="[difficulty === coin ? 'ring-2 ring-indigo-500 scale-110 animate-bounce-slow' : 'opacity-40']" 
                  class="transition-all rounded-full bg-white shadow-sm">
            <img :src="`/images/coin-${coin}.png`" class="w-8 h-8" />
          </button>
        </div>

        <div class="flex items-center">
          <h1 class="bg-orange-500 text-white px-3 py-1.5 rounded-xl font-black shadow-lg border-b-4 border-orange-700 uppercase tracking-tighter text-[10px] text-center leading-none h-full flex items-center">
            EXPEDICIÓN<br>MATEMÁTICA
          </h1>
        </div>

        <div class="flex items-center justify-end gap-1.5 h-full">
          <div class="bg-indigo-900 text-white px-2 rounded-xl font-black text-[10px] shadow-inner h-full flex items-center border-b-4 border-indigo-950">
            MISIÓN {{ currentRound }}/6
          </div>
          <button @click="$emit('close')" class="bg-red-500 text-white w-10 h-10 rounded-full shadow-lg font-black border-b-4 border-red-700 text-xl shrink-0">✕</button>
        </div>
      </header>

      <main class="flex-1 flex flex-col px-4 pt-4 pb-10 gap-2 overflow-hidden justify-between select-none z-10 relative">
        
        <section class="relative z-20 shrink-0 mt-2">
          <div class="absolute -top-6 -left-2 w-28 h-28 globe-wrapper z-30 drop-shadow-xl">
            <div :class="['relative w-full h-full transition-transform duration-1000', { 'rotate-y-360': isRotating }]">
              <svg viewBox="0 0 100 100" class="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="#3b82f6" stroke="#1e40af" stroke-width="1"/>
                <path d="M30,40 Q35,30 45,35 T60,30 T75,45 T65,60 T50,70 T30,60 Z" fill="#22c55e" />
                <path d="M70,60 Q75,55 85,65 T75,80 T60,70 Z" fill="#16a34a" />
              </svg>
              <div class="absolute inset-0 flex items-center justify-center backface-hidden">
                <div class="bg-blue-950/90 text-white px-2 py-0.5 rounded font-black text-[9px] uppercase border border-white/30 translate-y-3">
                  {{ currentChallenge?.continente }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 ml-14 pl-16 pr-3 pt-4 pb-3 bg-white border-4 border-yellow-400 rounded-3xl shadow-lg min-h-[90px]">
            <div class="font-bold text-[13px] leading-tight">
              <p class="mb-1 text-black">{{ logicalSplitHistory.part1 }}</p>
              <p class="text-blue-600 font-extrabold">{{ logicalSplitHistory.part2 }}</p>
            </div>
          </div>
          
          <div class="bg-yellow-50 text-indigo-950 p-2.5 rounded-xl shadow-lg transform -rotate-1 border-4 border-yellow-400 mt-2 mx-2">
            <p class="font-black italic text-[13px] text-center leading-tight">{{ currentChallenge?.pregunta }}</p>
          </div>
        </section>

        <section class="flex-1 flex flex-col justify-center bg-slate-100 rounded-[2.5rem] border-2 border-white relative px-2 my-2 min-h-0 shadow-inner">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-700 px-5 py-1 rounded-full border-2 border-white shadow-md z-20">
            <h2 class="font-black text-white text-[10px] tracking-widest uppercase">Estaciones de Trabajo</h2>
          </div>
          
          <div class="flex flex-col gap-2 py-1">
            <div v-for="i in [1, 2]" :key="i" class="flex items-center justify-center gap-3 p-2 rounded-3xl transition-all h-[70px]"
                 :class="step === i ? 'bg-white shadow-xl border-2 border-indigo-400 scale-[1.02]' : 'opacity-30 grayscale blur-[1px]'">
              <span class="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md border-b-4 border-indigo-800 shrink-0">{{ i }}</span>
              <div class="flex items-center gap-2">
                <div v-for="field in ['a', 'op', 'b', 'eq', 'res']" :key="field">
                  <span v-if="field === 'op'" class="font-black text-indigo-600 text-2xl mx-1">{{ currentChallenge?.pasos[i-1].op === 'x' ? '×' : currentChallenge?.pasos[i-1].op }}</span>
                  <span v-else-if="field === 'eq'" class="font-black text-slate-400 text-2xl mx-1">=</span>
                  <div v-else class="w-14 h-10 rounded-xl flex items-center justify-center font-black text-lg border-2 shadow-sm"
                       :class="isTarget(i-1, field) ? 'bg-amber-50 border-amber-400 text-amber-700 animate-pulse' : 'bg-slate-50 border-slate-100'">
                    {{ displayCell(i-1, field) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="grid grid-cols-3 gap-3 shrink-0 z-10 px-1">
          <button v-for="(opt, idx) in currentOptions" :key="idx" 
                  @click="checkAnswer(opt)" :disabled="revealFinalAnswer"
                  :class="[getButtonClass(opt), revealFinalAnswer ? 'opacity-50' : '']"
                  class="h-16 rounded-2xl font-black text-3xl shadow-lg border-b-[6px] transition-all active:translate-y-1 active:border-b-0 touch-manipulation bg-white">
            <div class="text-[10px] opacity-60 font-bold -mb-1">{{ ['A', 'B', 'C'][idx] }}</div>
            {{ opt }}
          </button>
        </section>
      </main>

      <CoinRain v-if="showRain" :type="difficulty" class="z-50" />

      <div v-if="showFinalPopup" class="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none p-4">
        <div class="bg-yellow-400 border-4 border-white p-6 rounded-[2rem] shadow-2xl animate-pop-in pointer-events-auto max-w-[240px] text-center w-full">
          <div class="text-5xl mb-2">🏆</div>
          <h3 class="font-black text-indigo-900 text-lg leading-tight uppercase">¡EXPEDICIÓN COMPLETA!</h3>
          <div class="my-3 bg-white/50 rounded-xl py-2 border-2 border-yellow-500">
            <p class="text-indigo-950 font-black text-sm uppercase">Ganaste</p>
            <p class="text-3xl font-black text-orange-600">+{{ totalPointsEarned }}</p>
            <p class="text-indigo-950 font-bold text-[10px] uppercase">Monedas de {{ difficulty }}</p>
          </div>
          <button @click="resetExpedition" class="mt-2 w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-sm shadow-lg border-b-4 border-indigo-950 active:scale-95 transition-transform">
            CONTINUAR
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { worldTourData } from '../data/worldTourData';
import { useGamificationStore } from '../stores/useGamificationStore';
import { playSound } from '../utils/sound';
import CoinRain from './CoinRain.vue';

const store = useGamificationStore();
const step = ref(1);
const currentRound = ref(1);
const difficulty = ref('silver');
const isRotating = ref(false);
const showRain = ref(false);
const showFinalPopup = ref(false);
const floatingPoints = ref(false);
const selectedAnswer = ref(null);
const isWrong = ref(false);
const revealFinalAnswer = ref(false);
const totalPointsEarned = ref(0); // Acumulador de puntos para el popup final

const continentPool = ["América", "Europa", "Asia", "África", "Oceanía", "Antártida"];
const shuffledPool = ref([...continentPool].sort(() => Math.random() - 0.5));

const currentChallenge = computed(() => {
  const cont = shuffledPool.value[currentRound.value - 1];
  const list = worldTourData.filter(d => d.continente === cont);
  return list[Math.floor(Math.random() * list.length)];
});

const logicalSplitHistory = computed(() => {
  const text = currentChallenge.value?.historia || "";
  const dotIndex = text.indexOf('. ');
  return dotIndex !== -1 ? { part1: text.substring(0, dotIndex+1), part2: text.substring(dotIndex+1).trim() } : { part1: text, part2: "" };
});

const currentReward = computed(() => ({ gold: 10, silver: 5, copper: 2 }[difficulty.value]));

const targetFields = ref([['a','b','res'][Math.floor(Math.random()*3)], ['a','b','res'][Math.floor(Math.random()*3)]]);
const isTarget = (r, f) => targetFields.value[r] === f;

const displayCell = (r, f) => {
  if (step.value === 1 && r === 1) return "?";
  if (r === 1 && isTarget(1, f) && revealFinalAnswer.value) return currentChallenge.value.pasos[1][f];
  if (step.value === r + 1 && isTarget(r, f)) return "?";
  return currentChallenge.value.pasos[r][f];
};

const currentOptions = computed(() => {
  if (!currentChallenge.value) return [];
  const correct = currentChallenge.value.pasos[step.value - 1][targetFields.value[step.value - 1]];
  const opts = new Set([correct, correct + 2, Math.abs(correct - 4), correct + 1]);
  return Array.from(opts).slice(0, 3).sort(() => Math.random() - 0.5);
});

const setDifficulty = (d) => { difficulty.value = d; playSound('click'); };

const checkAnswer = (val) => {
  const correct = currentChallenge.value.pasos[step.value - 1][targetFields.value[step.value - 1]];
  selectedAnswer.value = val;
  if (val === correct) {
    isWrong.value = false;
    playSound('correct');
    if (step.value === 1) {
      setTimeout(() => { step.value = 2; selectedAnswer.value = null; }, 600);
    } else {
      revealFinalAnswer.value = true;
      // TIMING: Estación 2 permanece 1.5s antes de avanzar
      setTimeout(() => { handleMissionComplete(); }, 1500);
    }
  } else {
    isWrong.value = true;
    playSound('wrong');
    setTimeout(() => { selectedAnswer.value = null; }, 600);
  }
};

const handleMissionComplete = () => {
  totalPointsEarned.value += currentReward.value; // Acumular para el popup final
  store.completeWorldTourChallenge(difficulty.value, currentReward.value);
  
  if (currentRound.value < 6) {
    floatingPoints.value = true;
    isRotating.value = true;
    setTimeout(() => {
      floatingPoints.value = false;
      isRotating.value = false;
      currentRound.value++;
      step.value = 1;
      selectedAnswer.value = null;
      revealFinalAnswer.value = false;
      targetFields.value = [['a','b','res'][Math.floor(Math.random()*3)], ['a','b','res'][Math.floor(Math.random()*3)]];
    }, 1200);
  } else {
    showRain.value = true;
    playSound('coins');
    setTimeout(() => { showFinalPopup.value = true; }, 800);
  }
};

const resetExpedition = () => {
  currentRound.value = 1;
  totalPointsEarned.value = 0;
  shuffledPool.value = [...continentPool].sort(() => Math.random() - 0.5);
  showRain.value = false;
  showFinalPopup.value = false;
  revealFinalAnswer.value = false;
  step.value = 1;
};

onMounted(() => { document.body.style.overflow = 'hidden'; });

const getButtonClass = (opt) => {
  const base = "bg-white border-slate-200 text-slate-800";
  if (selectedAnswer.value !== opt) return base;
  return isWrong.value ? 'bg-red-500 border-red-700 text-white animate-shake' : 'bg-green-500 border-green-700 text-white scale-95';
};
</script>

<style scoped>
.rotate-y-360 { transform: rotateY(360deg); }
.globe-wrapper { perspective: 1000px; }
.backface-hidden { backface-visibility: hidden; }
.float-enter-active { animation: float-up 1.2s ease-out; }
@keyframes float-up { 0% { transform: translate(-50%, 0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translate(-50%, -50px); opacity: 0; } }
.animate-bounce-slow { animation: bounce-rotate 2s infinite; }
@keyframes bounce-rotate { 0%, 100% { transform: translateY(0) rotateY(0deg); } 50% { transform: translateY(-5px) rotateY(180deg); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25%, 75% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
.animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
.animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes pop-in { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
* { -webkit-tap-highlight-color: transparent; }
</style>