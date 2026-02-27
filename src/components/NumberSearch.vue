<script setup>
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Search, Trophy, AlertCircle, Sparkles, Coins } from 'lucide-vue-next';
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
    speak("¡Sopa de números activada!");
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
    emit('win', { type: 'silver', count: prize });
};

onMounted(() => initGame());
</script>

<template>
  <div class="fixed inset-0 z-[200] bg-white flex justify-center items-center overflow-hidden select-none normal-case">
    
    <div class="w-full max-w-xl h-full bg-slate-50 flex flex-col items-center relative shadow-2xl border-x border-slate-200 overflow-hidden">
        
        <CoinRain v-if="showCoinRain" type="silver" :count="50" class="z-[400]" />

        <header class="w-full flex items-center justify-between px-4 py-3 shrink-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-indigo-900 font-black text-sm sm:text-base uppercase tracking-tighter italic">
                <Search size="20" class="text-indigo-500" /> SOPA NUMÉRICA
            </div>
            
            <button @click="initGame" 
              class="text-indigo-600 font-black text-[11px] uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-100 bg-indigo-50 shadow-sm active:scale-95 transition-all">
              Nueva Sopa
            </button>
          </div>

          <button @click="$emit('close')" 
                  class="bg-slate-100/50 hover:bg-slate-200/70 border border-slate-200 text-slate-500 p-2 rounded-full transition-all active:scale-90 shadow-sm">
              <CloseIcon :size="22" />
          </button>
        </header>

        <main class="flex-1 flex flex-col items-center justify-start p-2 gap-3 overflow-hidden pt-4">
            
            <div class="w-full grid grid-cols-4 gap-2 mb-2 px-2 shrink-0">
                <div v-for="ch in challenges" :key="ch.text" 
                    :class="['py-2.5 rounded-xl border text-center transition-all', 
                             ch.found ? 'bg-green-100 border-green-200 opacity-30 scale-90' : 'bg-white border-indigo-50 shadow-sm']">
                    <p :class="['text-2xl font-black leading-none italic tracking-tighter', ch.found ? 'text-green-700 line-through' : 'text-indigo-900']">
                        {{ ch.text }}
                    </p>
                </div>
            </div>

            <div class="relative w-full max-w-[340px] aspect-square bg-white rounded-[2.5rem] p-1 shadow-2xl border-4 border-white ring-8 ring-indigo-50/50 overflow-hidden shrink-0">
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

            <div class="w-full max-w-[380px] bg-white p-5 rounded-[2.5rem] border-2 border-indigo-100 shadow-md relative mt-2 shrink-0">
                <div class="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    REGLAS DEL RETO
                </div>
                <div class="space-y-3 mt-1">
                    <div class="flex items-center gap-3">
                        <Sparkles size="16" class="text-indigo-500 shrink-0" />
                        <p class="text-[13px] font-bold text-slate-700 leading-tight">Busca los 12 resultados en horizontal o vertical.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 flex items-center justify-center shadow-sm shrink-0">
                            <Coins size="10" class="text-yellow-800" />
                        </div>
                        <p class="text-[13px] font-bold text-slate-700 leading-tight">Sin fallos: <span class="text-indigo-600 font-black">10 PLATA</span>.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <AlertCircle size="16" class="text-red-500 shrink-0" />
                        <p class="text-[13px] font-bold text-slate-700 leading-tight">Con algún error: <span class="text-indigo-500 font-black">5 PLATA</span>.</p>
                    </div>
                </div>
            </div>
        </main>

        <div class="h-6 shrink-0"></div>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti />
            <Trophy class="w-20 h-20 text-amber-500 mb-4 drop-shadow-2xl" />
            <h2 class="text-3xl font-black text-indigo-900 mb-2 leading-none italic">¡Sopa Resuelta!</h2>
            
            <div class="bg-indigo-50 border-4 border-indigo-100 rounded-[3rem] p-8 mb-8 shadow-inner w-full max-w-[240px]">
               <div class="flex items-center justify-center gap-3">
                  <img src="/images/coin-silver.png" class="w-12 h-12" />
                  <span class="text-6xl font-black text-indigo-900 italic tracking-tighter">+{{ perfectGame ? 10 : 5 }}</span>
               </div>
            </div>

            <button @click="initGame" class="w-full max-w-[240px] bg-indigo-600 text-white font-black py-4 rounded-[2rem] shadow-xl border-b-4 border-indigo-800 active:translate-y-1 transition-all text-sm mb-4">OTRO DESAFÍO</button>
            <button @click="$emit('close')" class="text-slate-400 font-black text-[10px] tracking-widest py-2">VOLVER AL PORTAL</button>
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