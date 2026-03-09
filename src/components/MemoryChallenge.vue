<script setup>
/** * ARCHIVO: MemoryChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + REGLAS DIDÁCTICAS
 * LOGICA: Emparejamiento Memoria + Navegación Quirúrgica Blindada
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Brain, Trophy, AlertCircle, Sparkles, CheckCircle2, PlayCircle, BookOpen, Timer } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); // 'rules' | 'playing' | 'finished'
const cards = ref([]);
const flippedCards = ref([]);
const errors = ref(0);
const matches = ref(0);
const showCoinRain = ref(false);

// Marcador de progreso en tiempo real (Session)
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const pairColors = [
    'bg-pink-50 border-pink-200', 'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200', 'bg-amber-50 border-amber-200',
    'bg-purple-50 border-purple-200', 'bg-orange-50 border-orange-200'
];

// --- 2. LÓGICA DE NAVEGACIÓN QUIRÚRGICA ---
const startGame = () => {
    gameState.value = 'playing';
    initGame();
};

const returnToRules = () => {
    gameState.value = 'rules';
    flippedCards.value = [];
};

const exitToPortal = () => {
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    emit('close');
};

// --- 3. MOTOR DEL JUEGO ---
const initGame = () => {
    showCoinRain.value = false;
    errors.value = 0;
    matches.value = 0;
    flippedCards.value = [];
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    
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
            sessionCoins.value.gold++;
            flippedCards.value = [];
            if (matches.value === 6) setTimeout(() => triggerWin(), 800);
        } else {
            errors.value++;
            card1.hasError = true;
            card2.hasError = true;
            setTimeout(() => {
                card1.isFlipped = false; card2.isFlipped = false;
                card1.hasError = false; card2.hasError = false;
                flippedCards.value = [];
            }, 700); 
        }
    }
};

const triggerWin = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    playCoinSound(); playOwlHoot();
    
    let finalPrize = errors.value < 6 ? 10 : 5;
    sessionCoins.value.gold = finalPrize;
    await store.addCoins('gold', finalPrize);
    emit('win', { type: 'gold', count: finalPrize });
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        <CoinRain v-if="showCoinRain" type="gold" :count="50" class="z-[400] pointer-events-none" />

        <header v-if="gameState === 'playing'" class="header-memoria shrink-0">
            <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <Trophy size="16" class="text-yellow-500" />
                <span class="font-black text-sm text-indigo-900">{{ matches }}/6</span>
            </div>

            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="returnToRules" class="btn-close-mem"><CloseIcon :size="20" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-4 overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in">
                <button @click="exitToPortal" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6">
                    <Brain size="60" class="text-indigo-600 animate-bounce mb-2" />
                    <h1 class="game-title text-3xl">MEMORIA PRO</h1>
                </div>

                <div class="rules-panel shadow-xl w-full">
                    <div class="rules-badge">MANUAL DEL DESAFÍO</div>
                    <div class="flex flex-col gap-5 p-2">
                        <div class="flex gap-4 items-start">
                            <div class="bg-indigo-100 p-2 rounded-xl"><Sparkles class="text-indigo-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">Encuentra las parejas uniendo cada **operación** con su **resultado** correcto.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2 rounded-xl"><Trophy class="text-green-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">Si completas el tablero con **menos de 6 errores**, ¡ganas **10 monedas de Oro**!</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-amber-100 p-2 rounded-xl"><AlertCircle class="text-amber-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-600">Si tienes 6 o más errores, recibirás **5 monedas de Oro** por tu esfuerzo.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" class="btn-action-primary w-full py-5 text-xl uppercase italic shadow-[0_6px_0_rgb(30,58,138)]">
                    ¡EMPEZAR DESAFÍO! <PlayCircle class="ml-2" />
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <h1 class="title-memoria shrink-0">Buscando Parejas</h1>
                <div class="cards-grid">
                    <div v-for="card in cards" :key="card.id" 
                          class="card-wrapper aspect-square"
                          @click="handleCardClick(card)">
                        <div :class="['card-inner-box transition-all duration-300 preserve-3d', card.isFlipped ? 'rotate-y-180' : '']">
                            <div class="absolute inset-0 backface-hidden rounded-xl sm:rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 border-[3px] border-indigo-200 shadow-inner">
                                <Brain size="28" class="text-indigo-400 opacity-50" />
                            </div>
                            <div :class="['absolute inset-0 backface-hidden rotate-y-180 rounded-xl sm:rounded-2xl flex items-center justify-center border-[3px] shadow-sm', 
                                          card.hasError ? 'border-red-500 bg-red-100' : card.isMatched ? 'border-green-400 bg-green-50' : card.color]">
                                <span :class="['font-black text-center leading-none px-1 transition-colors', 
                                               card.hasError ? 'text-red-700' : card.isMatched ? 'text-green-700' : (card.type === 'op' ? 'text-lg sm:text-2xl text-indigo-950' : 'text-2xl sm:text-4xl text-indigo-600')]">
                                    {{ card.content }}
                                </span>
                                <CheckCircle2 v-if="card.isMatched" class="absolute top-1 right-1 text-green-500" size="14" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="h-10"></div>
            </template>

            <Transition name="pop">
              <div v-if="gameState === 'finished'" class="victory-overlay animate-fade-in uppercase">
                <SimpleConfetti />
                <Trophy class="w-20 h-20 text-yellow-500 mb-4 drop-shadow-xl animate-bounce" />
                <h2 class="victory-title">¡Misión Cumplida!</h2>
                <p class="victory-subtitle">Errores cometidos: {{ errors }}</p>
                
                <div class="prize-container">
                   <div class="flex items-center justify-center gap-3">
                      <img src="/images/coin-gold.png" class="w-14 h-14 object-contain" />
                      <span class="text-6xl font-black text-amber-600 italic tracking-tighter">+{{ sessionCoins.gold }}</span>
                   </div>
                </div>

                <div class="flex flex-col gap-4 w-full max-w-[280px]">
                    <button @click="startGame" class="btn-victory-primary py-4 uppercase font-black tracking-widest italic">NUEVA PARTIDA</button>
                    <button @click="exitToPortal" class="btn-victory-secondary py-4 uppercase font-bold text-xs tracking-widest">SALIR AL PORTAL</button>
                </div>
              </div>
            </Transition>
        </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400&family=Inter:wght@400;700;900&display=swap');

/* LEY DE HIERRO v2.9.2 */

.master-container {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    background-color: #ffffff; overflow: hidden;
    touch-action: none !important; font-family: 'Inter', sans-serif !important;
}

.app-canvas {
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none; width: 100vw; height: 100dvh;
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.header-memoria {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 50;
}

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.loot-item span { font-weight: 900; color: #1e293b; font-size: 1rem; }

.btn-close-mem { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.title-memoria { font-size: 1.5rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; margin-bottom: 1rem; }

/* GRID DE CARTAS */
.cards-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem; width: 95%; max-width: 420px; padding: 0.5rem;
}

.card-wrapper { perspective: 1000px; cursor: pointer; }
.card-inner-box { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }

.rules-panel {
    width: 92%; background: white; padding: 1.5rem; border-radius: 2rem;
    border: 2px solid #e0e7ff; position: relative;
}
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.btn-action-primary { background: #4f46e5; color: white; border-radius: 2rem; font-weight: 900; transition: all 0.1s; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.btn-action-primary:active { transform: translateY(5px); }

/* VICTORY OVERLAY */
.victory-overlay {
    position: absolute; inset: 0; z-index: 300; background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2rem; text-align: center;
}
.victory-title { font-size: 2.8rem; font-weight: 900; color: #312e81; font-style: italic; line-height: 1; margin-bottom: 0.5rem; }
.victory-subtitle { font-size: 11px; font-weight: 800; color: #6366f1; letter-spacing: 0.2em; margin-bottom: 1.5rem; }

.prize-container { background: #fffbeb; border: 4px solid #fef3c7; border-radius: 3rem; padding: 2rem; width: 100%; max-width: 280px; margin-bottom: 2rem; box-shadow: inset 0 2px 8px rgba(0,0,0,0.05); }

.btn-victory-primary { width: 100%; background: #f59e0b; color: white; font-weight: 900; border-radius: 1.25rem; box-shadow: 0 6px 0 #b45309; }
.btn-victory-primary:active { transform: translateY(3px); box-shadow: 0 3px 0 #b45309; }
.btn-victory-secondary { width: 100%; background: #94a3b8; color: white; border-radius: 1.25rem; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.9) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>