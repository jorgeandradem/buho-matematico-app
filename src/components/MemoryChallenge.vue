<script setup>
/** * ARCHIVO: MemoryChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.5 - ELIMINACIÓN TOTAL 3D + BORDE DORADO GARANTIZADO
 * LOGICA: Renderizado estático v-if para estabilidad absoluta. Reglas 100% íntegras.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Brain, Trophy, AlertCircle, Sparkles, CheckCircle2, PlayCircle, Star } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const cards = ref([]);
const flippedCards = ref([]);
const errors = ref(0);
const matches = ref(0);
const showCoinRain = ref(false);

const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// Depuración quirúrgica: Eliminamos bordes antiguos para no chocar con el dorado
const pairColors = [
    'bg-pink-50 text-pink-700', 'bg-blue-50 text-blue-700',
    'bg-green-50 text-green-700', 'bg-amber-50 text-amber-700',
    'bg-purple-50 text-purple-700', 'bg-orange-50 text-orange-700'
];

const starColors = [
    'text-red-500', 'text-blue-500', 'text-green-500', 
    'text-yellow-500', 'text-purple-500', 'text-pink-500'
];

// --- 2. LÓGICA DE NAVEGACIÓN ---
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
        deck.push({ 
            id: `op-${index}`, matchId: index, content: pair.text, 
            isFlipped: false, isMatched: false, type: 'op', hasError: false, 
            color: pairColors[index], starColor: starColors[index] 
        });
        deck.push({ 
            id: `res-${index}`, matchId: index, content: pair.res, 
            isFlipped: false, isMatched: false, type: 'res', hasError: false, 
            color: pairColors[index], starColor: starColors[index]
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
            new Audio('/audios/correct1.mp3').play().catch(() => {});
            card1.isMatched = true;
            card2.isMatched = true;
            matches.value++;
            sessionCoins.Gold++;

            // 🛡️ REPORTE VIVO: Mueve la llamita en tiempo real
            store.updateMissionProgress('memory_match_found', 1);

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
            }, 800); 
        }
    }
};

const triggerWin = async () => {
    gameState.value = 'finished';
    showCoinRain.value = true;
    
    // 🛡️ REPORTE DE RACHA: Partida completa
    store.updateMissionProgress('play_any_game', 1);

    playCoinSound(); playOwlHoot();
    let finalPrize = errors.value < 6 ? 10 : 5;
    sessionCoins.Gold = finalPrize;
    await store.addCoins('gold', finalPrize);
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        
        <header v-if="gameState === 'playing'" class="header-memoria shrink-0">
            <div class="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">
                <Trophy size="18" class="text-yellow-500" />
                <span class="font-black text-indigo-900">{{ matches }}/6</span>
            </div>

            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.Gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="returnToRules" class="btn-close-mem"><CloseIcon :size="20" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-4 relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in">
                <button @click="exitToPortal" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6">
                    <Brain size="70" class="text-indigo-600 animate-bounce mb-2" />
                    <h1 class="game-title text-4xl uppercase italic font-black text-indigo-900">MEMORIA PRO</h1>
                    <span class="text-[10px] font-black text-amber-500 tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mt-2">v2.9.5 GOLD EDITION</span>
                </div>

                <div class="rules-panel shadow-2xl w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-100">
                    <div class="rules-badge uppercase font-black tracking-widest">Manual de Misión</div>
                    <div class="flex flex-col gap-6 p-2 mt-4 text-left">
                        <div class="flex gap-4 items-start">
                            <div class="bg-indigo-100 p-2.5 rounded-xl shrink-0"><Sparkles class="text-indigo-600" size="24" /></div>
                            <p class="text-[15px] font-bold text-slate-700 leading-tight">Encuentra las parejas uniendo cada **operación** con su **resultado** correcto.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-amber-100 p-2.5 rounded-xl shrink-0"><Star class="text-amber-600" size="24" /></div>
                            <p class="text-[15px] font-bold text-slate-700 leading-tight">Guíate por el **color de la estrella**; las parejas reales tienen el mismo color.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2.5 rounded-xl shrink-0"><Trophy class="text-green-600" size="24" /></div>
                            <p class="text-[15px] font-bold text-slate-700 leading-tight">Completar con menos de 6 errores otorga **10 Monedas de Oro**.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                               active:translate-y-[4px] transition-all 
                               flex items-center justify-center py-4 group">
                    ¡EMPEZAR! 
                    <PlayCircle class="ml-3 group-hover:rotate-12 transition-transform" size="26" />
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <h1 class="title-memoria shrink-0 mt-2">Buscando Parejas</h1>
                
                <div class="cards-grid">
                    <div v-for="card in cards" :key="card.id" 
                          class="card-wrapper aspect-square"
                          @click="handleCardClick(card)">
                        
                        <div class="w-full h-full relative">
                            <div v-if="!card.isFlipped && !card.isMatched" 
                                 class="absolute inset-0 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 border-b-8 border-indigo-900 shadow-xl transition-all active:scale-95">
                                <Brain size="36" class="text-white opacity-40" />
                            </div>

                            <div v-else 
                                 :class="['absolute inset-0 rounded-2xl flex flex-col items-center justify-between p-3 border-4 border-b-8 shadow-2xl animate-pop-in', 
                                          card.color, /* Color de fondo y texto base del par */
                                          card.hasError ? 'border-red-500 bg-red-100 !text-red-700' : 
                                          card.isMatched ? 'border-green-500 bg-green-100 !text-green-800' : 
                                          'border-amber-400' /* Borde dorado premium para carta volteada normal */]">
                                
                                <div class="w-full flex justify-center pt-1">
                                    <Star :class="['shrink-0 drop-shadow-sm', card.starColor]" size="24" fill="currentColor" />
                                </div>

                                <div class="flex-1 flex items-center justify-center w-full">
                                    <span :class="['font-black text-center leading-none tracking-tighter transition-colors', 
                                                   card.type === 'op' ? 'text-xl sm:text-2xl' : 'text-4xl sm:text-5xl italic']">
                                         {{ card.content }}
                                    </span>
                                </div>

                                <div class="h-6 w-full flex justify-center items-center pb-1">
                                    <CheckCircle2 v-if="card.isMatched" class="text-green-600" size="20" stroke-width="3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="h-4"></div>
            </template>

            <Transition name="pop">
              <div v-if="gameState === 'finished'" class="victory-overlay animate-fade-in uppercase italic font-black">
                <SimpleConfetti />
                <CoinRain v-if="showCoinRain" type="gold" :count="40" class="z-[400] pointer-events-none" />
                <div class="flex flex-col items-center w-full z-[500]">
                    <Trophy class="w-20 h-20 text-yellow-500 mb-2 drop-shadow-xl animate-bounce" />
                    <h2 class="victory-title text-indigo-950 text-3xl mb-1">¡LOGRADO!</h2>
                    <div class="prize-card-compact bg-white shadow-xl border-4 border-b-[10px] border-amber-400 rounded-[3rem] p-6 my-4">
                        <div class="flex flex-col items-center">
                           <img src="/images/coin-gold.png" class="w-20 h-20 object-contain" />
                           <span class="text-6xl text-amber-600 tracking-tighter">+{{ sessionCoins.Gold }}</span>
                        </div>
                    </div>
                    <button @click="startGame" class="w-full max-w-[280px] py-4 rounded-[2rem] text-2xl font-black italic uppercase text-white bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] border-b-[8px] border-[#1E3A8A]">NUEVA PARTIDA</button>
                    <button @click="exitToPortal" class="text-slate-400 py-4 font-black text-sm hover:text-indigo-600 uppercase tracking-widest opacity-70">SALIR AL PORTAL</button>
                </div>
              </div>
            </Transition>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO MASTER-CONTAINER v2.9.5 */
.master-container {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    background-color: #ffffff; overflow: hidden;
    height: 100dvh; 
}

.app-canvas {
    display: flex; flex-direction: column;
    position: relative; overflow: hidden; transition: all 0.4s;
    user-select: none; width: 100vw; height: 100dvh;
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; } }

.header-memoria {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 50;
}

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9;
}

.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; }

.btn-close-mem { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

/* 🛡️ GRID PLANO SIN ESPACIO FANTASMA */
.cards-grid {
    display: grid; 
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 12px; 
    width: 94%; max-width: 440px; 
    flex: 1; margin: 1rem 0;
}

.card-wrapper { cursor: pointer; position: relative; }

.rules-panel { position: relative; }
.rules-badge { position: absolute; top: -14px; left: 1.5rem; background: #4f46e5; color: white; font-size: 11px; padding: 5px 15px; border-radius: 9999px; }

.victory-overlay {
    position: absolute; inset: 0; z-index: 300; background: #f8fafc;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 1rem; text-align: center;
}

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.title-memoria { font-size: 1.6rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Animación de aparición plana (Pop en lugar de Giro 3D) */
.animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>