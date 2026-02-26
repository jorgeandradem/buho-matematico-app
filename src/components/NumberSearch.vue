<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft, Search, Trophy, Star, Target, AlertCircle, Sparkles, Coins } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import OwlImage from './OwlImage.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- ESTADO DEL JUEGO ---
const grid = ref([]);
const challenges = ref([]);
const currentSelection = ref([]);
const gameFinished = ref(false);
const showCoinRain = ref(false);
const perfectGame = ref(true);
const confirmedCells = ref(new Set());

const initGame = () => {
    gameFinished.value = false;
    showCoinRain.value = false;
    currentSelection.value = [];
    perfectGame.value = true;
    confirmedCells.value.clear();
    
    const newChallenges = [];
    const ops = ['+', '-', '×']; 
    while(newChallenges.length < 12) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        let res = op === '+' ? a + b : (op === '-' ? (a+10) - b : a * b);
        const text = `${op === '-' ? a+10 : a}${op}${b}`;
        if (!newChallenges.find(c => c.text === text)) {
            newChallenges.push({ text, result: res.toString(), found: false });
        }
    }
    challenges.value = newChallenges;

    let gridReady = false;
    while (!gridReady) {
        const tempGrid = Array.from({ length: 36 }, (_, i) => ({ id: i, val: '', status: 'neutral', isOverlapping: false }));
        const usageCount = new Array(36).fill(0);
        let placedAll = true;

        for (const ch of challenges.value) {
            let placed = false;
            let pAttempts = 0;
            const digits = ch.result.split('');

            while (!placed && pAttempts < 250) {
                const isHorizontal = Math.random() > 0.5;
                const startIdx = Math.floor(Math.random() * 36);
                const canPlace = digits.every((d, i) => {
                    const pos = isHorizontal ? startIdx + i : startIdx + (i * 6);
                    return pos < 36 && (isHorizontal ? Math.floor(pos/6) === Math.floor(startIdx/6) : true) && (tempGrid[pos].val === '' || tempGrid[pos].val === d);
                });

                if (canPlace) {
                    digits.forEach((d, i) => { 
                        const pos = isHorizontal ? startIdx + i : startIdx + (i * 6); 
                        tempGrid[pos].val = d; 
                        usageCount[pos]++; 
                    });
                    placed = true;
                }
                pAttempts++;
            }
            if (!placed) { placedAll = false; break; }
        }

        if (placedAll) {
            grid.value = tempGrid.map((cell, idx) => {
                if (cell.val === '') cell.val = Math.floor(Math.random() * 10).toString();
                cell.isOverlapping = usageCount[idx] > 1; 
                return cell;
            });
            gridReady = true;
        }
    }
    if (gameFinished.value) speak("¡Sopa lista!");
};

const handleCellClick = (cell) => {
    if (gameFinished.value || currentSelection.value.includes(cell)) return;
    
    cell.status = 'selected';
    currentSelection.value.push(cell);
    const typedValue = currentSelection.value.map(c => c.val).join('');
    const match = challenges.value.find(ch => ch.result === typedValue && !ch.found);

    if (match) {
        match.found = true;
        currentSelection.value.forEach(c => {
            c.status = 'correct';
            confirmedCells.value.add(c.id);
        });
        currentSelection.value = [];
        if (challenges.value.every(ch => ch.found)) triggerWin();
    } else if (!challenges.value.some(ch => ch.result.startsWith(typedValue) && !ch.found)) {
        perfectGame.value = false;
        currentSelection.value.forEach(c => c.status = 'error');
        setTimeout(() => {
            currentSelection.value.forEach(c => { 
                c.status = confirmedCells.value.has(c.id) ? 'correct' : 'neutral'; 
            });
            currentSelection.value = [];
        }, 400);
    }
};

const triggerWin = async () => {
    gameFinished.value = true;
    showCoinRain.value = true;
    playCoinSound();
    playOwlHoot();
    const prize = perfectGame.value ? 10 : 5;
    await store.addCoins('silver', prize);
    emit('win', { type: 'silver', count: prize * 4 });
};

onMounted(() => initGame());
</script>

<template>
  <div class="fixed inset-0 z-[200] bg-white flex justify-center items-center overflow-hidden select-none normal-case">
    
    <div class="w-full max-w-xl h-full bg-slate-50 flex flex-col items-center p-4 relative shadow-2xl border-x border-slate-200 overflow-hidden">
        
        <CoinRain v-if="showCoinRain" type="silver" :count="50" class="z-[400]" />

        <div class="w-full flex justify-between items-center mb-3 pt-2 shrink-0 px-2 uppercase">
          <button @click="$emit('close')" class="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg border-b-4 border-indigo-800 active:translate-y-1 active:border-b-0 transition-all font-black text-xs">
              <ArrowLeft size="18" />
              REGRESAR
          </button>
          
          <button @click="initGame" 
            class="text-indigo-600 font-bold text-[11px] uppercase tracking-widest px-4 py-2 rounded-full border-[0.5px] border-indigo-200/50 bg-white shadow-sm active:scale-95 transition-all">
            Nueva Sopa
          </button>

          <div class="bg-white px-3 py-1.5 rounded-xl border-2 border-indigo-100 shadow-sm flex items-center gap-2">
            <Search size="12" class="text-indigo-400" />
            <span class="text-indigo-600 font-black text-[10px] italic">SOPA NUMÉRICA</span>
          </div>
        </div>

        <div class="w-full grid grid-cols-4 gap-1.5 mb-3 px-2 shrink-0">
            <div v-for="ch in challenges" :key="ch.text" 
                :class="['py-2 rounded-xl border text-center transition-all', 
                         ch.found ? 'bg-green-100 border-green-200 opacity-30 scale-90' : 'bg-white border-indigo-50 shadow-sm']">
                <p :class="['text-2xl font-black leading-none italic tracking-tighter', ch.found ? 'text-green-700 line-through' : 'text-indigo-900']">
                    {{ ch.text }}
                </p>
            </div>
        </div>

        <div class="relative w-full max-w-[340px] aspect-square bg-white rounded-[2rem] p-1 shadow-2xl border-4 border-white ring-8 ring-indigo-50/50 overflow-hidden shrink-0">
            <div class="grid grid-cols-6 grid-rows-6 h-full w-full gap-0 border border-slate-100">
                <button v-for="cell in grid" :key="cell.id" @click="handleCellClick(cell)"
                    :class="['h-full w-full flex items-center justify-center relative border-[0.5px] border-slate-50 text-3xl font-black transition-all italic',
                        cell.status === 'neutral' ? 'bg-white text-slate-400' : '',
                        cell.status === 'selected' ? 'bg-yellow-300 text-yellow-900 z-10 scale-110 shadow-lg rounded-lg' : '',
                        cell.status === 'correct' ? 'bg-green-500/20 text-green-700' : '',
                        cell.status === 'error' ? 'bg-red-500/20 text-red-700 animate-shake' : '']">
                    
                    <div v-if="cell.isOverlapping && cell.status === 'neutral'" 
                         class="absolute inset-1.5 border-[1.5px] border-indigo-200/40 rounded-full bg-indigo-50/30"></div>
                    
                    <span class="relative z-10">{{ cell.val }}</span>
                </button>
            </div>
        </div>

        <div class="mt-auto mb-24 w-[92%] bg-white p-4 rounded-[2.5rem] border-2 border-indigo-100 shadow-inner">
            <div class="flex items-center gap-2 mb-2">
                <Sparkles size="16" class="text-indigo-500" />
                <h4 class="font-black text-xs text-indigo-900 uppercase tracking-widest leading-none">Reglas de Recompensa</h4>
            </div>
            <ul class="text-[12.5px] font-normal text-slate-500 space-y-2 leading-snug">
                <li class="flex items-start gap-3">
                   <div class="w-6 h-6 mt-0.5 shrink-0"><OwlImage customClass="w-full h-full" /></div>
                   <span>Busca los 12 resultados en horizontal o vertical para completar la sopa.</span>
                </li>
                <li class="flex items-start gap-3">
                   <div class="w-6 h-6 shrink-0 flex items-center justify-center mt-0.5">
                       <div class="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center shadow-sm">
                           <Coins size="10" class="text-yellow-800" />
                       </div>
                   </div>
                   <span>Si terminas sin cometer fallos, ganas <span class="text-indigo-600 font-bold">10 monedas de plata</span>.</span>
                </li>
                <li class="flex items-start gap-3">
                   <div class="p-1 bg-slate-50 rounded-lg text-slate-400 shrink-0"><AlertCircle size="14" /></div>
                   <span>Si tienes algún error, el premio será de <span class="text-indigo-600 font-bold">5 monedas</span>.</span>
                </li>
            </ul>
        </div>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti />
            <Trophy class="w-24 h-24 text-amber-500 mb-6 drop-shadow-2xl" />
            <h2 class="text-4xl font-black text-indigo-900 mb-2 leading-none">¡Sopa Resuelta!</h2>
            <p class="text-indigo-400 font-bold mb-8 text-xs italic tracking-widest">{{ perfectGame ? 'PERFECCIÓN TOTAL' : '¡MUY BIEN HECHO!' }}</p>
            
            <div class="bg-indigo-50 border-4 border-indigo-100 rounded-[3rem] p-10 mb-10 shadow-inner w-full max-w-[280px]">
               <div class="flex items-center justify-center gap-4">
                  <img src="/images/coin-silver.png" class="w-14 h-14" />
                  <span class="text-7xl font-black text-indigo-900 italic tracking-tighter">+{{ perfectGame ? 10 : 5 }}</span>
               </div>
               <p class="text-[11px] font-black text-indigo-400 mt-4 tracking-[0.2em] leading-none">Monedas de Plata</p>
            </div>

            <button @click="initGame" class="w-full max-w-[280px] bg-indigo-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl border-b-8 border-indigo-800 active:translate-y-2 active:border-b-0 mb-4 text-xs tracking-widest transition-all">OTRO DESAFÍO</button>
            <button @click="$emit('close')" class="text-slate-400 font-black text-[10px] tracking-widest py-4">VOLVER AL INICIO</button>
          </div>
        </Transition>
    </div>
  </div>
</template>

<style scoped>
.animate-shake { animation: shake 0.2s ease-in-out infinite; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>