<script setup>
import { ref, onMounted, computed } from 'vue';
import { puzzleImages } from '../data/puzzleImages';
import { Lock, Trophy, X as CloseIcon, Sparkles, Coins } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import VirtualKeyPad from './VirtualKeypad.vue';
import OwlImage from './OwlImage.vue'; 
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const gamificationStore = useGamificationStore();

// --- ESTADO ---
const selectedImage = ref(null);
const squares = ref([]);
const activeSquare = ref(null);
const perfectAttempts = ref(0); 
const errorsInCurrentSquare = ref(0);
const gameFinished = ref(false);
const showConfetti = ref(false);
const showCoinRain = ref(false);

const showMathModal = ref(false);
const challenge = ref({ a: 0, b: 0, op: '', result: 0 });
const userAnswer = ref('');
const feedbackStatus = ref('neutral'); 

const generateChallenge = () => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, res;

    if (op === '+') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        res = a + b;
    } else if (op === '-') {
        a = Math.floor(Math.random() * 10) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        res = a - b;
    } else if (op === '×') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        res = a * b;
    } else { 
        res = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        a = res * b;
    }

    challenge.value = { a, b, op, result: res };
    userAnswer.value = '';
    feedbackStatus.value = 'neutral';
};

const initGame = () => {
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    selectedImage.value = puzzleImages[randomIndex];
    squares.value = Array.from({ length: 10 }, (_, i) => ({ id: i, unlocked: false }));
    perfectAttempts.value = 0;
    gameFinished.value = false;
    showConfetti.value = false;
    showCoinRain.value = false;
};

const getImageUrl = (fileName) => {
    return new URL(`../assets/puzzless/${fileName}`, import.meta.url).href;
};

const openChallenge = (index) => {
    if (squares.value[index].unlocked || gameFinished.value) return;
    activeSquare.value = index;
    errorsInCurrentSquare.value = 0;
    generateChallenge();
    showMathModal.value = true;
};

const handleKeyPress = (num) => {
    if (feedbackStatus.value === 'correct') return;
    if (userAnswer.value.length < 3) userAnswer.value += num;
    checkAutomaticAnswer();
};

const handleDelete = () => {
    if (feedbackStatus.value === 'correct') return;
    userAnswer.value = userAnswer.value.slice(0, -1);
    feedbackStatus.value = 'neutral';
};

const checkAutomaticAnswer = () => {
    const currentInput = parseInt(userAnswer.value);
    if (currentInput === challenge.value.result) {
        feedbackStatus.value = 'correct';
        if (errorsInCurrentSquare.value === 0) perfectAttempts.value++;
        
        setTimeout(() => {
            squares.value[activeSquare.value].unlocked = true;
            showMathModal.value = false;
            checkWinCondition();
        }, 600);
    } else if (userAnswer.value.length >= challenge.value.result.toString().length) {
        feedbackStatus.value = 'error';
        errorsInCurrentSquare.value++;
        setTimeout(() => {
            userAnswer.value = '';
            feedbackStatus.value = 'neutral';
        }, 800);
    }
};

const checkWinCondition = async () => {
    if (squares.value.every(s => s.unlocked)) {
        gameFinished.value = true;
        showConfetti.value = true;
        showCoinRain.value = true;
        playCoinSound();
        playOwlHoot();
        
        const prize = perfectAttempts.value === 10 ? 10 : 5;
        await gamificationStore.addCoins('silver', prize);
        emit('win', { type: 'silver', count: prize });
    }
};

onMounted(() => {
    document.body.style.overflow = 'hidden';
    initGame();
});
</script>

<template>
  <div class="fixed inset-0 z-[200] bg-white flex justify-center overflow-hidden select-none overscroll-none touch-none h-[100dvh] w-full">
    
    <div class="w-full max-w-[480px] h-full bg-slate-50 flex flex-col items-center p-3 relative shadow-2xl overflow-hidden mx-auto">
        
        <CoinRain v-if="showCoinRain" type="silver" :count="40" class="z-[400]" />

        <header class="w-full flex items-center justify-between px-4 py-2 shrink-0 bg-white border-b border-slate-100 z-10 mb-1">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-indigo-900 font-black text-sm uppercase tracking-tighter italic">
                <Trophy size="18" class="text-yellow-500" /> PIEZAS PRO: {{ perfectAttempts }}/10
            </div>
          </div>

          <button @click="$emit('close')" 
                  class="bg-slate-100/50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full active:scale-90 transition-all shadow-sm">
              <CloseIcon :size="20" />
          </button>
        </header>

        <main class="flex-1 w-full flex flex-col items-center justify-start p-2 overflow-hidden gap-3">
            
            <div v-if="selectedImage" class="relative w-full max-w-[280px] aspect-[4/5] bg-white rounded-[1.5rem] overflow-hidden shadow-2xl border-[4px] border-white ring-4 ring-indigo-50 flex-shrink-0 mt-1">
              <img :src="getImageUrl(selectedImage.fileName)" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 grid grid-cols-2 grid-rows-5">
                <div v-for="(square, i) in squares" :key="i" @click="openChallenge(i)"
                  :class="['transition-all duration-1000 border-[0.5px] border-indigo-100/30 flex items-center justify-center cursor-pointer', 
                           square.unlocked ? 'opacity-0 scale-150 pointer-events-none' : 'bg-slate-200/90 backdrop-blur-[2px]']">
                  <Lock v-if="!square.unlocked" class="w-6 h-6 text-slate-400 drop-shadow-sm" />
                </div>
              </div>
            </div>

            <div class="text-center px-4 uppercase shrink-0 mt-1">
                <p class="text-indigo-700 font-black text-sm sm:text-base tracking-wider animate-pulse">
                  Toca una pieza para desbloquear
                </p>
            </div>

            <div class="w-full max-w-[380px] bg-white p-4 rounded-3xl border-2 border-indigo-100 shadow-md relative shrink-0">
                <div class="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    REGLAS
                </div>
                <ul class="text-[14px] font-bold text-slate-600 space-y-3 mt-1">
                    <li class="flex items-center gap-3 leading-tight">
                       <div class="w-6 h-6 shrink-0"><OwlImage customClass="w-full h-full" /></div>
                       <span>Sin fallos (10/10): <span class="text-indigo-600 font-black">10 PLATA</span></span>
                    </li>
                    <li class="flex items-center gap-3 leading-tight">
                       <div class="w-6 h-6 shrink-0 flex items-center justify-center">
                           <div class="w-5 h-5 bg-yellow-400 rounded-full border border-yellow-600 flex items-center justify-center shadow-sm">
                               <Coins size="10" class="text-yellow-800" />
                           </div>
                       </div>
                       <span>Con algún error: <span class="text-indigo-600 font-black">5 PLATA</span></span>
                    </li>
                </ul>
            </div>
        </main>

        <Transition name="pop">
          <div v-if="showMathModal" class="absolute inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md uppercase h-full w-full">
            <div class="bg-white rounded-[2.5rem] p-6 w-full max-w-[320px] shadow-2xl text-center border-t-8 border-indigo-500 relative flex flex-col items-center">
              <button @click="showMathModal = false" class="absolute top-3 right-5 bg-slate-100 text-slate-500 p-1.5 rounded-full border border-slate-200 active:scale-90 transition-all">
                  <CloseIcon :size="16" />
              </button>
              <p class="text-slate-400 text-[9px] font-black uppercase mb-3 tracking-widest mt-2">Resuelve para abrir</p>
              <div class="text-4xl font-black text-indigo-600 tracking-tighter mb-4 italic">
                {{ challenge.a }} <span class="text-indigo-300 px-1">{{ challenge.op }}</span> {{ challenge.b }}
              </div>
              <div class="w-full mb-4">
                <div :class="['w-full text-center text-5xl font-black py-3 rounded-2xl transition-all border-4', 
                               feedbackStatus === 'correct' ? 'bg-green-500/10 border-green-400 text-green-700' : 
                               feedbackStatus === 'error' ? 'bg-red-500/10 border-red-400 text-red-700 animate-shake' : 
                               'bg-yellow-50 border-yellow-200 text-indigo-900 shadow-inner']">
                  {{ userAnswer || '?' }}
                </div>
              </div>
              <VirtualKeyPad @press="handleKeyPress" @delete="handleDelete" class="mb-4" />
              <button @click="generateChallenge" class="w-full bg-slate-50 text-slate-400 font-black py-2.5 rounded-xl active:scale-95 text-[9px] border border-slate-100 uppercase">
                Cambiar Reto
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti v-if="showConfetti" />
            <div class="relative mb-4">
               <Trophy class="w-16 h-16 text-amber-500 drop-shadow-2xl" />
               <Sparkles class="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
            </div>
            <h2 class="text-2xl font-black text-indigo-900 mb-1 italic">¡CONSEGUIDO!</h2>
            <p class="text-indigo-400 font-bold mb-6 text-[9px] tracking-[0.3em]">PRECISIÓN: {{ perfectAttempts }}/10</p>
            <div class="bg-indigo-50 border-4 border-indigo-100 rounded-[2.5rem] p-6 mb-6 shadow-inner w-full max-w-[200px]">
               <div class="flex items-center justify-center gap-2">
                  <img src="/images/coin-silver.png" class="w-8 h-8" />
                  <span class="text-5xl font-black text-indigo-900 italic tracking-tighter">
                      +{{ perfectAttempts === 10 ? 10 : 5 }}
                  </span>
               </div>
            </div>
            <button @click="initGame" class="w-full max-w-[220px] bg-indigo-600 text-white font-black py-4 rounded-xl shadow-xl border-b-4 border-indigo-800 active:scale-95 text-xs mb-3">OTRA AVENTURA</button>
            <button @click="$emit('close')" class="text-slate-400 font-black text-[10px] tracking-widest py-2">VOLVER AL PORTAL</button>
          </div>
        </Transition>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }

.animate-shake { animation: shake 0.2s ease-in-out infinite; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }

.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>