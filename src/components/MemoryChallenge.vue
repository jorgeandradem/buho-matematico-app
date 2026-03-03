<script setup>
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Brain, Trophy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import OwlImage from './OwlImage.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

const cards = ref([]);
const flippedCards = ref([]);
const errors = ref(0);
const matches = ref(0);
const gameFinished = ref(false);
const showCoinRain = ref(false);

const pairColors = [
    'bg-pink-50 border-pink-200',
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-amber-50 border-amber-200',
    'bg-purple-50 border-purple-200',
    'bg-orange-50 border-orange-200'
];

const initGame = () => {
    gameFinished.value = false;
    showCoinRain.value = false;
    errors.value = 0;
    matches.value = 0;
    flippedCards.value = [];
    
    const basePairs = [];
    const ops = ['+', '-', '×'];

    while (basePairs.length < 6) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        let res = op === '+' ? a + b : (op === '-' ? (a + 10) - b : a * b);
        let text = `${op === '-' ? a + 10 : a} ${op} ${b}`;
        
        if (!basePairs.find(p => p.text === text)) {
            basePairs.push({ text, res: res.toString() });
        }
    }

    const deck = [];
    basePairs.forEach((pair, index) => {
        const colorClass = pairColors[index];
        deck.push({ 
            id: `op-${index}`, matchId: index, content: pair.text, 
            isFlipped: false, isMatched: false, type: 'op', hasError: false, color: colorClass 
        });
        deck.push({ 
            id: `res-${index}`, matchId: index, content: pair.res, 
            isFlipped: false, isMatched: false, type: 'res', hasError: false, color: colorClass
        });
    });

    cards.value = deck.sort(() => Math.random() - 0.5);
    speak("¡Encuentra las parejas!");
};

const handleCardClick = (card) => {
    if (card.isFlipped || card.isMatched || flippedCards.value.length === 2) return;

    card.isFlipped = true;
    flippedCards.value.push(card);

    if (flippedCards.value.length === 2) {
        const [card1, card2] = flippedCards.value;

        if (card1.matchId === card2.matchId) {
            card1.isMatched = true;
            card2.isMatched = true;
            matches.value++;
            flippedCards.value = [];
            if (matches.value === 6) setTimeout(() => triggerWin(), 800);
        } else {
            errors.value++;
            card1.hasError = true;
            card2.hasError = true;
            
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                card1.hasError = false;
                card2.hasError = false;
                flippedCards.value = [];
            }, 700); 
        }
    }
};

const triggerWin = async () => {
    gameFinished.value = true;
    showCoinRain.value = true;
    playCoinSound(); 
    playOwlHoot();
    const prize = errors.value < 6 ? 10 : 5;
    await store.addCoins('gold', prize);
    emit('win', { type: 'gold', count: prize });
};

onMounted(() => {
    document.body.style.overflow = 'hidden';
    initGame();
});
</script>

<template>
  <div class="fixed inset-0 z-50 bg-white flex justify-center overflow-hidden font-sans select-none text-slate-900 overscroll-none touch-none w-full h-[100dvh]">
    <div class="w-full max-w-[480px] h-full flex flex-col bg-slate-50 relative shadow-2xl overflow-hidden mx-auto">
        
        <CoinRain v-if="showCoinRain" type="gold" :count="50" class="z-[400]" />

        <header class="w-full flex items-center justify-between px-4 py-2 shrink-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 text-indigo-900 font-black text-sm uppercase tracking-tighter">
                <Brain size="18" class="text-indigo-500" /> MEMORIA
            </div>
            
            <div class="flex gap-1.5 font-black text-[10px] uppercase">
              <div class="flex items-center gap-1 text-red-500 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100 shadow-sm">
                  <AlertCircle size="12" /> {{ errors }}
              </div>
              <div class="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-0.5 rounded-lg border border-green-100 shadow-sm">
                  <Trophy size="12" /> {{ matches }}/6
              </div>
            </div>
          </div>

          <button @click="$emit('close')" 
                  class="bg-slate-100/50 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full active:scale-90 transition-all shadow-sm">
              <CloseIcon :size="20" />
          </button>
        </header>

        <main class="flex-1 flex flex-col items-center justify-start p-3 overflow-hidden gap-4">
            
            <div class="grid grid-cols-3 gap-2 w-full max-w-[340px] shrink-0 mt-2">
                <div v-for="card in cards" :key="card.id" 
                      class="perspective-1000 aspect-square w-full h-full"
                      @click="handleCardClick(card)">
                    <div :class="['relative w-full h-full transition-all duration-300 preserve-3d cursor-pointer rounded-xl shadow-sm', 
                                  card.isFlipped ? 'rotate-y-180' : '']">
                        
                        <div class="absolute inset-0 backface-hidden rounded-xl flex items-center justify-center bg-sky-100/80 border-[2px] border-sky-300 shadow-inner">
                            <Brain size="22" class="text-pink-500 opacity-40" />
                        </div>

                        <div :class="['absolute inset-0 backface-hidden rotate-y-180 rounded-xl flex items-center justify-center border-2 shadow-sm transition-colors', 
                                      card.hasError ? 'border-red-500 bg-red-100' : card.isMatched ? 'border-green-400 bg-green-50' : card.color]">
                            <span :class="['font-black text-center leading-none px-0.5 transition-colors', 
                                           card.hasError ? 'text-red-700' : card.isMatched ? 'text-green-700' : (card.type === 'op' ? 'text-lg text-indigo-950' : 'text-2xl text-indigo-600')]">
                                {{ card.content }}
                            </span>
                            <CheckCircle2 v-if="card.isMatched" class="absolute top-1 right-1 text-green-500" size="12" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="w-full max-w-[380px] bg-white p-4 rounded-3xl border-2 border-indigo-100 shadow-md relative shrink-0">
                <div class="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    REGLAS
                </div>
                <div class="flex flex-col gap-3 mt-1">
                    <div class="flex items-center gap-3">
                        <Sparkles size="16" class="text-amber-500 shrink-0" />
                        <p class="text-[13px] font-bold text-slate-800 leading-tight">Une operación y resultado correctamente.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <Trophy size="16" class="text-green-600 shrink-0" />
                        <p class="text-[13px] font-bold text-slate-700 leading-tight">Menos de 6 fallos: <span class="text-green-700 font-black text-base">10 ORO</span></p>
                    </div>
                    <div class="flex items-center gap-3">
                        <AlertCircle size="16" class="text-blue-600 shrink-0" />
                        <p class="text-[13px] font-bold text-slate-700 leading-tight">6 o más fallos: <span class="text-blue-700 font-black text-base">5 ORO</span></p>
                    </div>
                </div>
            </div>
        </main>

        <Transition name="pop">
          <div v-if="gameFinished" class="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in uppercase">
            <SimpleConfetti />
            <Trophy class="w-16 h-16 text-amber-500 mb-4 drop-shadow-xl" />
            <h2 class="text-3xl font-black text-indigo-900 mb-2 italic">¡MAESTRO ORO!</h2>
            <div class="bg-amber-50 border-4 border-amber-100 rounded-[2.5rem] p-6 mb-6 shadow-inner w-full max-w-[220px]">
               <div class="flex items-center justify-center gap-2">
                  <img src="/images/coin-gold.png" class="w-10 h-10" />
                  <span class="text-5xl font-black text-amber-600 italic tracking-tighter">+{{ errors < 6 ? 10 : 5 }}</span>
               </div>
            </div>
            <button @click="initGame" class="w-full max-w-[220px] bg-amber-500 text-white font-black py-4 rounded-xl shadow-lg border-b-4 border-amber-700 active:translate-y-1 active:border-b-0 mb-4 text-[12px] transition-all">NUEVA PARTIDA</button>
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

.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.9) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>