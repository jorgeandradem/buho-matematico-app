<script setup>
/** * ARCHIVO: MEMORIA PRO - MemoryChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v4.3 - FIX COMPILACIÓN + MOTOR DE VOZ
 * LOGICA: Silencio en juego. Locución quirúrgica en reglas y premiación.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { 
    X as CloseIcon, Brain, Trophy, Sparkles, CheckCircle2, 
    PlayCircle, Star, RotateCcw, Volume2 
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const store = useGamificationStore();

// --- 🔊 MOTOR DE VOZ UNIFICADO (Web Speech API) ---
const speak = (text, mood = 'intro') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    if (mood === 'gold') {
        utterance.pitch = 1.4; 
        utterance.rate = 1.1; 
    } else if (mood === 'silver') {
        utterance.pitch = 1.0; 
        utterance.rate = 1.0;
    } else if (mood === 'copper') {
        utterance.pitch = 0.8; 
        utterance.rate = 0.9;
    } else {
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
    }
    window.speechSynthesis.speak(utterance);
};

const vocalizeRules = () => {
    speak("¡Bienvenido a Memoria Pro! Encuentra las parejas uniendo la operación con su resultado correcto. Las parejas tienen el mismo color de estrella. ¡Mucha suerte!");
};

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const cards = ref([]);
const flippedCards = ref([]);
const errors = ref(0);
const matches = ref(0);
const showCoinRain = ref(false);
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

// --- ⚡ WATCHERS ---
watch(gameState, (newState) => {
    if (newState === 'rules') {
        vocalizeRules();
    }
});

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
const handleBackNavigation = () => {
    if (gameState.value === 'playing' || gameState.value === 'finished') {
        gameState.value = 'rules';
        flippedCards.value = [];
    } else {
        emit('close');
    }
};

const startGame = () => {
    gameState.value = 'playing';
    initGame();
};

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
        let text = `${op === '-' ? a + 10 : a}${op}${b}`;
        
        if (!basePairs.find(p => p.text === text)) {
            basePairs.push({ text, res: res.toString(), opType: op });
        }
    }

    const deck = [];
    basePairs.forEach((pair, index) => {
        deck.push({ 
            id: `op-${index}`, matchId: index, content: pair.text, 
            isFlipped: false, isMatched: false, type: 'op', hasError: false, 
            color: pairColors[index], starColor: starColors[index],
            opType: pair.opType
        });
        deck.push({ 
            id: `res-${index}`, matchId: index, content: pair.res, 
            isFlipped: false, isMatched: false, type: 'res', hasError: false, 
            color: pairColors[index], starColor: starColors[index],
            opType: pair.opType
        });
    });

    cards.value = deck.sort(() => Math.random() - 0.5);
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
            
            if (card1.opType === '+') sessionCoins.value.copper++;
            else if (card1.opType === '-') sessionCoins.value.silver++;
            else sessionCoins.value.gold++;

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
    playCoinSound(); 
    playOwlHoot();
    
    let mood = errors.value === 0 ? 'gold' : (errors.value < 4 ? 'silver' : 'copper');
    let bonusPrize = errors.value < 6 ? 10 : 5;
    sessionCoins.value.gold += bonusPrize;
    
    const finalResultText = `¡Misión cumplida! Operación completada con ${errors.value} errores. Has ganado un botín de ${sessionCoins.value.gold} monedas de oro, ${sessionCoins.value.silver} de plata y ${sessionCoins.value.copper} de cobre.`;
    speak(finalResultText, mood);

    await store.addCoins('gold', sessionCoins.value.gold);
    await store.addCoins('silver', sessionCoins.value.silver);
    await store.addCoins('copper', sessionCoins.value.copper);
};

onMounted(() => {
    vocalizeRules();
});

onUnmounted(() => {
    window.speechSynthesis.cancel();
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        
        <header class="header-standard shrink-0" :class="{ 'bg-transparent border-transparent': gameState === 'rules' }">
            <div class="trophy-section" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
                <Trophy size="22" class="text-yellow-500"></Trophy>
                <span class="text-xl font-black text-indigo-900">{{ matches }}/6</span>
            </div>

            <div class="session-loot-capsule" :style="{ visibility: gameState !== 'rules' ? 'visible' : 'hidden' }">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="handleBackNavigation" class="btn-close-circle">
                <CloseIcon size="24" stroke-width="3"></CloseIcon>
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 animate-fade-in overflow-y-auto">
                <div class="flex flex-col items-center mt-2 text-center">
                    <div class="brain-portal-wrap animate-brain-float mb-4">
                        <div class="data-ring"></div>
                        <img src="/images/cyber-brain.png?v=1" alt="Cerebro" class="cyber-brain-img" />
                    </div>
                    <h1 class="game-title text-4xl uppercase italic font-black text-indigo-900">MEMORIA PRO</h1>
                </div>

                <div class="rules-panel shadow-2xl w-full max-w-[400px] mt-4 relative">
                    <button @click="vocalizeRules" class="absolute -top-3 -right-3 bg-indigo-600 text-white p-2 rounded-full shadow-lg active:scale-90 transition-all border-2 border-white">
                        <Volume2 size="20"></Volume2>
                    </button>

                    <div class="rules-badge uppercase">Misión</div>
                    <div class="flex flex-col gap-4 p-2 mt-2 text-left">
                        <div class="flex gap-3 items-start">
                            <Sparkles class="text-indigo-600 shrink-0" size="20"></Sparkles>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Une la operación con su resultado correcto.</p>
                        </div>
                        <div class="flex gap-3 items-start">
                            <Star class="text-amber-500 shrink-0" size="20"></Star>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Las parejas tienen el mismo color de estrella.</p>
                        </div>
                        <div class="flex gap-3 items-start">
                            <Trophy class="text-green-600 shrink-0" size="20"></Trophy>
                            <p class="text-sm font-bold text-slate-700 leading-tight">¡Gana Oro, Plata y Cobre! Bono final con menos de 6 errores.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" class="btn-primary-action w-full max-w-[420px] mt-6 shrink-0">
                    ¡A JUGAR! <PlayCircle class="ml-3" size="26"></PlayCircle>
                </button>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
                <div class="main-visual-area flex-1 flex items-center justify-center w-full px-2 min-h-0">
                    <div class="memory-belt">
                        <div class="memory-grid">
                            <div v-for="card in cards" :key="card.id" class="card-wrapper" @click="handleCardClick(card)">
                                <div v-if="!card.isFlipped && !card.isMatched" class="card-base card-back shadow-lg">
                                    <Brain size="40" class="cyber-brain-card"></Brain>
                                </div>
                                <div v-else :class="['card-base card-front border-4 border-b-8 animate-pop-in shadow-xl', card.color, card.hasError ? 'border-red-500 bg-red-100' : (card.isMatched ? 'border-green-500 bg-green-100' : 'border-amber-400')]">
                                    <Star :class="[card.starColor]" size="22" fill="currentColor"></Star>
                                    <span class="card-text-clamp font-black text-center leading-none tracking-tighter">{{ card.content }}</span>
                                    <div class="h-[22px] flex items-center justify-center">
                                        <CheckCircle2 v-if="card.isMatched" class="text-green-600" size="20" stroke-width="3"></CheckCircle2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in uppercase bg-white/50 backdrop-blur-sm z-20">
                <SimpleConfetti></SimpleConfetti>
                <CoinRain v-if="showCoinRain" type="gold" :count="40"></CoinRain>
                
                <div class="flex flex-col items-center justify-center text-center w-full max-w-[320px]">
                    <Trophy size="100" class="text-yellow-500 mb-4 animate-bounce shrink-0"></Trophy>
                    <h2 class="game-title text-3xl mb-6 shrink-0">¡OPERACIÓN COMPLETADA!</h2>
                    
                    <div class="bg-white border-4 border-b-[10px] border-amber-400 p-6 rounded-[3rem] shadow-2xl mb-8 w-full shrink-0">
                        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Botín Obtenido</p>
                        <div class="flex justify-around items-center w-full">
                           <div class="flex flex-col items-center"><img src="/images/coin-gold.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-amber-600">+{{ sessionCoins.gold }}</span></div>
                           <div class="flex flex-col items-center border-x border-slate-200 px-4"><img src="/images/coin-silver.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-slate-500">+{{ sessionCoins.silver }}</span></div>
                           <div class="flex flex-col items-center"><img src="/images/coin-copper.png" class="w-10 h-10 mb-1" /><span class="text-2xl font-black text-orange-600">+{{ sessionCoins.copper }}</span></div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-4 w-full shrink-0">
                        <button @click="startGame" class="btn-primary-action w-full !bg-emerald-500 !border-emerald-700">
                            VOLVER A JUGAR <RotateCcw size="20" class="ml-2"></RotateCcw>
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
/* Estilos blindados */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; touch-action: none !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; transition: all 0.3s;}
.trophy-section { display: flex; align-items: center; gap: 8px; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; font-weight: 900; color: #1e293b; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.btn-close-circle { background: white; color: #ef4444; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #fca5a5; cursor: pointer; z-index: 110; }
.memory-belt { width: 100%; max-width: 440px; aspect-ratio: 3/4; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.memory-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: 12px; width: 100%; height: 100%; }
.card-wrapper { width: 100%; height: 100%; cursor: pointer; position: relative; }
.card-base { position: absolute; inset: 0; border-radius: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 0.6rem; }
.card-back { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); border-bottom: 8px solid #1e1b4b; display: flex; align-items: center; justify-content: center; }
.card-front { background-color: white; }
.card-text-clamp { font-size: clamp(1rem, 5vw, 1.8rem); word-break: break-all; }
.brain-portal-wrap { position: relative; width: 200px; height: 160px; display: flex; justify-content: center; align-items: center; }
.cyber-brain-img { width: 140px; height: auto; object-fit: contain; position: relative; z-index: 10; filter: drop-shadow(0 0 15px rgba(236,72,153,0.6)) drop-shadow(0 0 25px rgba(56,189,248,0.6)); animation: brainPulse 2s infinite alternate; }
@keyframes brainPulse { 0% { filter: drop-shadow(0 0 10px rgba(236,72,153,0.4)) drop-shadow(0 0 15px rgba(56,189,248,0.4)); transform: scale(0.98); } 100% { filter: drop-shadow(0 0 25px rgba(236,72,153,0.8)) drop-shadow(0 0 35px rgba(56,189,248,0.8)); transform: scale(1.02); } }
.data-ring { position: absolute; top: 50%; left: 50%; width: 180px; height: 180px; border: 2px solid rgba(56, 189, 248, 0.2); border-top: 3px solid #38bdf8; border-bottom: 3px solid #ec4899; border-radius: 50%; transform: translate(-50%, -50%) rotateX(75deg); animation: spinData 3s linear infinite; z-index: 0; }
@keyframes spinData { 0% { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg); } 100% { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg); } }
.animate-brain-float { animation: brainFloat 4s ease-in-out infinite; }
@keyframes brainFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.cyber-brain-card { color: #ec4899; fill: #ec4899; filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white); }
.game-title { font-size: 2.5rem; font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; text-align: center; }
.rules-panel { width: 92%; background: white; padding: 1.5rem; border-radius: 2rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #4f46e5; color: white; font-size: 10px; font-weight: 900; padding: 4px 15px; border-radius: 9999px; }
.btn-primary-action { background: #3b82f6; color: white; font-weight: 900; font-size: 1.2rem; padding: 1.2rem; border-radius: 1.5rem; border-bottom: 6px solid #1d4ed8; display: flex; align-items: center; justify-content: center; transition: 0.1s; cursor: pointer; }
.btn-primary-action:active { transform: translateY(3px); border-bottom-width: 2px; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>