<script setup>
import { ref, onMounted, computed } from 'vue';
import { puzzleImages } from '../data/puzzleImages';
import { Lock, Trophy, ArrowLeft, X, Sparkles, Coins } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import VirtualKeyPad from './VirtualKeypad.vue';
import OwlImage from './OwlImage.vue'; // Inyectado para consistencia visual
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
        emit('win', { type: 'silver', count: prize * 4 });
    }
};

onMounted(() => initGame());
</script>

<template>
  <div class="fixed inset-0 z-[200] bg-white flex justify-center overflow-hidden select-none normal-case">
    
    <div class="w-full max-w-xl h-full bg-slate-50 flex flex-col items-center p-4 relative shadow-2xl border-x border-slate-200">
        
        <CoinRain v-if="showCoinRain" type="silver" :count="40" class="z-[400]" />

        <div class="w-full flex justify-between items-center mb-6 pt-4 shrink-0 px-2">
          <button @click="$emit('close')" class="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all font-black text-xs uppercase">
              <ArrowLeft size="18" />
              REGRESAR
          </button>
          <div class="bg-white px-4 py-2 rounded-xl border-2 border-indigo-100 shadow-sm flex items-center gap-2">
            <Trophy size="14" class="text-yellow-500" />
            <span class="text-indigo-600 font-black text-[10px] italic uppercase">PIEZAS PRO: {{ perfectAttempts }}/10</span>
          </div>
        </div>

        <div v-if="selectedImage" class="relative w-full max-w-[320px] aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white ring-4 ring-indigo-50 flex-shrink-0">
          <img :src="getImageUrl(selectedImage.fileName)" class="absolute inset-0 w-full h-full object-cover" />
          <div class="absolute inset-0 grid grid-cols-2 grid-rows-5">
            <div v-for="(square, i) in squares" :key="i" @click="openChallenge(i)"
              :class="['transition-all duration-1000 border-[0.5px] border-indigo-100/30 flex items-center justify-center cursor-pointer', 
                       square.unlocked ? 'opacity-0 scale-150 pointer-events-none' : 'bg-slate-200/90 backdrop-blur-[2px]']">
              <Lock v-if="!square.unlocked" class="w-7 h-7 text-slate-400 drop-shadow-sm" />
            </div>
          </div>
        </div>

        <div class="mt-8 text-center px-6 uppercase">
            <p class="text-indigo-700 font-black text-lg tracking-wider animate-pulse">
              Toca una pieza para desbloquear
            </p>
        </div>

        <div class="mt-auto mb-24 w-[92%] bg-white p-4 rounded-[2.5rem] border-2 border-indigo-100 shadow-inner">
            <h4 class="font-black text-xs text-indigo-900 mb-2 tracking-widest flex items-center gap-2 uppercase">
                <Sparkles size="14" class="text-indigo-500" /> REGLAS DE RECOMPENSA
            </h4>
            <ul class="text-[14px] font-normal text-slate-500 space-y-2">
                <li class="flex items-start gap-3 leading-snug">
                   <div class="w-6 h-6 shrink-0 mt-0.5"><OwlImage customClass="w-full h-full" /></div>
                   <span>Si completas el puzzle sin fallos (10/10), ganas <span class="text-indigo-600 font-bold">10 monedas de plata</span>.</span>
                </li>
                <li class="flex items-start gap-3 leading-snug">
                   <div class="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                       <div class="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-sm flex items-center justify-center">
                           <Coins size="10" class="text-yellow-800" />
                       </div>
                   </div>
                   <span>Si cometes algún error en las piezas, ganarás <span class="text-indigo-600 font-bold">5 monedas de plata</span>.</span>
                </li>
            </ul>
        </div>

        <Transition name="pop">
          <div v-if="showMathModal" class="absolute inset-0 z-[250] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md uppercase">
            <div class="bg-white rounded-[3.5rem] p-8 w-full max-w-[340px] shadow-2xl text-center border-t-8 border-indigo-500 relative flex flex-col items-center">
              
              <button @click="showMathModal = false" class="absolute top-4 left-6 bg-slate-100 text-slate-500 px-4 py-2 rounded-xl border-b-2 border-slate-300 active:translate-y-1 transition-all font-black text-[9px]">
                  REGRESAR
              </button>

              <p class="text-slate-400 text-[10px] font-black uppercase mb-4 tracking-widest mt-4">Resuelve para abrir</p>
              
              <div class="text-5xl font-black text-indigo-600 tracking-tighter mb-6 italic">
                {{ challenge.a }} <span class="text-indigo-300 px-1">{{ challenge.op }}</span> {{ challenge.b }}
              </div>

              <div class="w-full relative mb-6">
                <div :class="['w-full text-center text-6xl font-black py-5 rounded-[2rem] transition-all duration-300 border-4', 
                             feedbackStatus === 'correct' ? 'bg-green-500/20 border-green-400 text-green-700' : 
                             feedbackStatus === 'error' ? 'bg-red-500/20 border-red-400 text-red-700 animate-shake' : 
                             'bg-yellow-50 border-yellow-200 animate-pulse-soft text-indigo-900 shadow-inner']">
                  {{ userAnswer || '?' }}
                  <span v-if="userAnswer !== '' && feedbackStatus === 'neutral'" class="inline-block w-1 h-12 bg-indigo-500 animate-blink ml-1"></span>
                </div>
              </div>

              <VirtualKeyPad @press="handleKeyPress" @delete="handleDelete" class="mb-6" />
              
              <button @click="generateChallenge" class="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl active:scale-95 text-xs tracking-widest border-2 border-slate-200 uppercase">
                Cambiar Reto
              </button>
            </div>
          </div>
        </Transition>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti v-if="showConfetti" />
            
            <div class="relative mb-6">
               <Trophy class="w-24 h-24 text-amber-500 drop-shadow-2xl" />
               <Sparkles class="absolute -top-2 -right-2 text-amber-400 animate-pulse" />
            </div>

            <h2 class="text-4xl font-black text-indigo-900 mb-2">¡CONSEGUIDO!</h2>
            <p class="text-indigo-400 font-bold mb-8 text-xs italic tracking-widest">PRECISIÓN: {{ perfectAttempts }}/10</p>
            
            <div class="bg-indigo-50 border-4 border-indigo-100 rounded-[3rem] p-10 mb-10 shadow-inner w-full max-w-[280px]">
               <div class="flex items-center justify-center gap-4">
                  <img src="/images/coin-silver.png" class="w-14 h-14 drop-shadow-md" />
                  <span class="text-7xl font-black text-indigo-900 italic tracking-tighter">
                     +{{ perfectAttempts === 10 ? 10 : 5 }}
                  </span>
               </div>
               <p class="text-[11px] font-black text-indigo-400 mt-4 tracking-[0.2em] uppercase leading-none">Monedas de Plata</p>
            </div>

            <button @click="initGame" class="w-full max-w-[280px] bg-indigo-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl border-b-8 border-indigo-800 active:translate-y-2 active:border-b-0 mb-4 text-xs tracking-widest transition-all">OTRA AVENTURA</button>
            <button @click="$emit('close')" class="text-slate-400 font-black text-[10px] tracking-widest uppercase py-4">VOLVER AL INICIO</button>
          </div>
        </Transition>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-soft { animation: pulse-soft 2s infinite ease-in-out; }
@keyframes pulse-soft {
  0%, 100% { background-color: rgba(254, 252, 232, 1); border-color: rgba(254, 240, 138, 1); }
  50% { background-color: rgba(254, 252, 232, 0.5); border-color: rgba(254, 240, 138, 0.4); }
}

.animate-blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }

.animate-shake { animation: shake 0.2s ease-in-out infinite; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { 
    from { opacity: 0; transform: scale(0.95) translateY(20px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
}
</style>