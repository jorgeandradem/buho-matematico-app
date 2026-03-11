<script setup>
/** * ARCHIVO: MemoryChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 - CINTURÓN ANTI-DESBORDE + ESTÉTICA CYBERPUNK + FINAL CENTRADO
 * LOGICA: Renderizado plano v-if. Iconografía de alto contraste neón. Botones completos.
 */
import { ref, onMounted } from 'vue';
import { X as CloseIcon, Brain, Trophy, Sparkles, CheckCircle2, PlayCircle, Star } from 'lucide-vue-next';
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

const initGame = () => {
    showCoinRain.value = false;
    errors.value = 0; matches.value = 0;
    flippedCards.value = [];
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    
    const basePairs = [];
    const ops = ['+', '-', '×'];

    while (basePairs.length < 6) {
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 10) + 1;
        let b = Math.floor(Math.random() * 10) + 1;
        let res = op === '+' ? a + b : (op === '-' ? (a + 10) - b : a * b);
        let text = `${op === '-' ? a + 10 : a}${op}${b}`;
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
            card1.isMatched = true; card2.isMatched = true;
            matches.value++;
            sessionCoins.value.gold++;
            store.updateMissionProgress('memory_match_found', 1);
            flippedCards.value = [];
            if (matches.value === 6) setTimeout(() => triggerWin(), 600);
        } else {
            errors.value++;
            card1.hasError = true; card2.hasError = true;
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
    store.updateMissionProgress('play_any_game', 1);
    playCoinSound(); playOwlHoot();
    let finalPrize = errors.value < 6 ? 10 : 5;
    sessionCoins.value.gold = finalPrize;
    await store.addCoins('gold', finalPrize);
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50">
        
        <header v-if="gameState !== 'rules'" class="header-standard shrink-0">
            <div class="trophy-section">
                <Trophy size="22" class="text-yellow-500" />
                <span class="text-xl font-black text-indigo-900">{{ matches }}/6</span>
            </div>
            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>
            <button @click="emit('close')" class="btn-close-circle"><CloseIcon :size="20" /></button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-2 relative overflow-hidden">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in">
                <button @click="emit('close')" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6 text-center">
                    <div class="cyber-icon-container mb-4 shadow-xl">
                        <Brain size="65" class="cyber-brain-rules" />
                    </div>
                    <h1 class="game-title">MEMORIA PRO</h1>
                </div>

                <div class="rules-panel shadow-2xl w-full max-w-[400px]">
                    <div class="rules-badge uppercase">Misión</div>
                    <div class="flex flex-col gap-4 p-2 mt-2 text-left">
                        <div class="flex gap-3 items-start">
                            <Sparkles class="text-indigo-600 shrink-0" size="20" />
                            <p class="text-sm font-bold text-slate-700 leading-tight">Une la operación con su resultado correcto.</p>
                        </div>
                        <div class="flex gap-3 items-start">
                            <Star class="text-amber-500 shrink-0" size="20" />
                            <p class="text-sm font-bold text-slate-700 leading-tight">Las parejas tienen el mismo color de estrella.</p>
                        </div>
                        <div class="flex gap-3 items-start">
                            <Trophy class="text-green-600 shrink-0" size="20" />
                            <p class="text-sm font-bold text-slate-700 leading-tight">Menos de 6 errores = 10 Monedas de Oro.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg active:translate-y-[4px] transition-all 
                               flex items-center justify-center py-4 group mb-4">
                    ¡A JUGAR! 
                    <PlayCircle class="ml-3" size="26" />
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <div class="main-visual-area flex-1 flex items-center justify-center w-full px-4">
                    <div class="memory-belt">
                        <div class="memory-grid">
                            <div v-for="card in cards" :key="card.id" class="card-wrapper" @click="handleCardClick(card)">
                                <div v-if="!card.isFlipped && !card.isMatched" 
                                     class="card-base card-back shadow-lg">
                                    <Brain size="40" class="cyber-brain-card" />
                                </div>
                                <div v-else 
                                     :class="['card-base card-front border-4 border-b-8 animate-pop-in shadow-xl', 
                                              card.color, card.hasError ? 'border-red-500 bg-red-100' : 
                                              card.isMatched ? 'border-green-500 bg-green-100' : 'border-amber-400']">
                                    <Star :class="[card.starColor]" size="22" fill="currentColor" />
                                    <span class="card-text-clamp font-black text-center leading-none tracking-tighter">
                                        {{ card.content }}
                                    </span>
                                    <div class="h-[22px] flex items-center justify-center">
                                        <CheckCircle2 v-if="card.isMatched" class="text-green-600" size="20" stroke-width="3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div v-else-if="gameState === 'finished'" class="victory-overlay animate-fade-in">
                <SimpleConfetti />
                <CoinRain v-if="showCoinRain" type="gold" :count="40" />
                
                <div class="flex flex-col items-center justify-center text-center w-full max-w-[320px]">
                    <Trophy size="100" class="text-yellow-500 mb-4 animate-bounce" />
                    <h2 class="game-title text-3xl mb-6">¡OPERACIÓN COMPLETADA!</h2>
                    
                    <div class="bg-white border-4 border-b-[10px] border-amber-400 p-8 rounded-[3rem] shadow-2xl mb-8 w-full">
                        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Botín de Oro</p>
                        <span class="text-6xl font-black text-amber-600 tracking-tighter">+{{ sessionCoins.gold }}</span>
                    </div>

                    <div class="flex flex-col gap-4 w-full">
                        <button @click="startGame" class="w-full py-4 rounded-[2rem] bg-blue-600 text-white font-black italic uppercase shadow-lg border-b-4 border-blue-900 active:translate-y-1">
                            VOLVER A JUGAR
                        </button>
                        <button @click="emit('close')" class="w-full py-2 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            VOLVER AL PORTAL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* 🛡️ ESTRUCTURA MAESTRA (Escalado 3 Niveles) */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; touch-action: none !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.game-title { font-size: 1.8rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; text-align: center; }
.rules-panel { width: 92%; background: white; padding: 1.2rem; border-radius: 1.75rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -10px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 2px 10px; border-radius: 9999px; }
.btn-close-circle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

/* 🛡️ EL CINTURÓN ANTI-DESBORDE */
.memory-belt { width: 100%; max-width: 440px; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; }
.memory-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 12px; width: 100%; height: 100%; }

.card-wrapper { width: 100%; height: 100%; cursor: pointer; position: relative; }
.card-base { position: absolute; inset: 0; border-radius: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 0.6rem; }
.card-back { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border-bottom: 8px solid #1e1b4b; display: flex; align-items: center; justify-content: center; }
.card-front { background-color: white; }
.card-text-clamp { font-size: clamp(1rem, 5vw, 1.8rem); word-break: break-all; }

/* 🧠 CYBERPINK VISUALS */
.cyber-brain-rules, .cyber-brain-card {
    color: #ec4899; fill: #ec4899;
    filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);
}
.cyber-icon-container { background: #1e1b4b; padding: 1.2rem; border-radius: 2rem; border: 3px solid #4f46e5; }

.victory-overlay { position: absolute; inset: 0; z-index: 300; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; }

.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>