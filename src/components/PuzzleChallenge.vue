<script setup>
/** * ARCHIVO: PuzzleChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.3 + BLINDAJE DVH + REPORTE VIVO
 * LOGICA: Reporte de cada pieza al Store para avance de misiones en tiempo real.
 */
import { ref, onMounted, computed } from 'vue';
import { puzzleImages } from '../data/puzzleImages';
import { Lock, Trophy, X as CloseIcon, Sparkles, BookOpen, PlayCircle, MousePointer2, ChevronRight } from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import VirtualKeyPad from './VirtualKeypad.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const gamificationStore = useGamificationStore();

// --- 1. ESTADO DEL JUEGO ---
const gameState = ref('rules'); 
const selectedImage = ref(null);
const squares = ref([]);
const activeSquare = ref(null);
const perfectAttempts = ref(0); 
const totalErrors = ref(0); 
const errorsInCurrentSquare = ref(0);
const showConfetti = ref(false);
const showCoinRain = ref(false);

const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const showMathModal = ref(false);
const challenge = ref({ a: 0, b: 0, op: '', result: 0 });
const userAnswer = ref('');
const feedbackStatus = ref('neutral'); 

// --- 2. LÓGICA DE NAVEGACIÓN ---
const startGame = () => {
    gameState.value = 'playing';
    initGame();
};

const returnToRules = () => {
    gameState.value = 'rules';
    showMathModal.value = false;
};

const exitToPortal = () => {
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    emit('close');
};

// --- 3. MOTOR DEL JUEGO ---
const playCorrectAudio = () => {
    const audio = new Audio('/audios/correct1.mp3');
    audio.volume = 1.0;
    audio.play().catch(e => console.warn("Audio bloqueado:", e));
};

const generateChallenge = () => {
    const ops = ['+', '-', '×', '÷'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, res;

    if (op === '+') {
        a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; res = a + b;
    } else if (op === '-') {
        a = Math.floor(Math.random() * 10) + 10; b = Math.floor(Math.random() * 10) + 1; res = a - b;
    } else if (op === '×') {
        a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; res = a * b;
    } else { 
        res = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; a = res * b;
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
    totalErrors.value = 0;
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 }; 
    showConfetti.value = false;
    showCoinRain.value = false;
};

const getImageUrl = (fileName) => {
    return new URL(`../assets/puzzless/${fileName}`, import.meta.url).href;
};

const openChallenge = (index) => {
    if (squares.value[index].unlocked || gameState.value !== 'playing') return;
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
        playCorrectAudio();

        // 🛡️ REPORTE QUIRÚRGICO A MISIONES: Notificamos avance con cada pieza
        gamificationStore.updateMissionProgress('solve_puzzle_piece', 1);

        if (errorsInCurrentSquare.value === 0) perfectAttempts.value++;
        
        if (challenge.value.op === '+') sessionCoins.value.copper++;
        else if (challenge.value.op === '-') sessionCoins.value.silver++;
        else sessionCoins.value.gold++; 

        setTimeout(() => {
            if (activeSquare.value !== null) { squares.value[activeSquare.value].unlocked = true; }
            showMathModal.value = false;
            checkWinCondition();
        }, 600);
    } else if (userAnswer.value.length >= challenge.value.result.toString().length) {
        feedbackStatus.value = 'error';
        errorsInCurrentSquare.value++;
        totalErrors.value++;
        speak("¡Oh no!", { volume: 1.0, pitch: 1.2 });
        setTimeout(() => { userAnswer.value = ''; feedbackStatus.value = 'neutral'; }, 800);
    }
};

const checkWinCondition = async () => {
    if (squares.value.every(s => s.unlocked)) {
        gameState.value = 'finished';
        showConfetti.value = true;
        showCoinRain.value = true;
        playCoinSound();
        playOwlHoot();
        
        // 🛡️ REPORTE DE PARTIDA COMPLETADA:
        gamificationStore.updateMissionProgress('play_any_game', 1);

        if (totalErrors.value > 6) {
            sessionCoins.value.gold = Math.min(sessionCoins.value.gold, 5);
            sessionCoins.value.silver = Math.min(sessionCoins.value.silver, 5);
            sessionCoins.value.copper = Math.min(sessionCoins.value.copper, 5);
        }

        await gamificationStore.addCoins('gold', sessionCoins.value.gold);
        await gamificationStore.addCoins('silver', sessionCoins.value.silver);
        await gamificationStore.addCoins('copper', sessionCoins.value.copper);
        emit('win', { ...sessionCoins.value });
    }
};

onMounted(() => {
    if (gameState.value === 'playing') initGame();
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        
        <CoinRain v-if="showCoinRain" type="gold" :count="40" class="z-[400]" />

        <header v-if="gameState === 'playing'" class="header-puzzle shrink-0">
            <div class="trophy-counter">
                <Trophy size="20" class="text-yellow-500" />
                <span class="font-black text-lg text-indigo-900">{{ perfectAttempts }}/10</span>
            </div>

            <div class="session-loot-capsule">
                <div class="loot-indicator"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-indicator border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-indicator"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="returnToRules" class="btn-close-puzzle">
                <CloseIcon :size="20" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col items-center justify-between py-4 overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in">
                <button @click="exitToPortal" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-6">
                    <Sparkles size="60" class="text-indigo-600 animate-bounce mb-2" />
                    <h1 class="game-title text-4xl uppercase italic font-black text-indigo-900">PUZZLE MÁGICO</h1>
                </div>

                <div class="rules-panel-puzzle shadow-2xl w-full">
                    <div class="rules-badge uppercase font-black tracking-widest">Manual del Constructor</div>
                    <div class="flex flex-col gap-5 p-2">
                        <div class="flex gap-4 items-start">
                            <div class="bg-indigo-100 p-2 rounded-xl"><MousePointer2 class="text-indigo-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Toca cualquier **pieza gris** para revelar un reto matemático.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2 rounded-xl"><BookOpen class="text-green-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">Resuelve la operación correctamente para **desbloquear la imagen**.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-amber-100 p-2 rounded-xl"><Trophy class="text-amber-600" size="20" /></div>
                            <p class="text-sm font-bold text-slate-700 leading-tight">¡Suma: 🥉 | Resta: 🥈 | Mult/Div: 🥇! Completa las 10 piezas.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                               active:translate-y-[4px] active:border-b-[4px] transition-all 
                               flex items-center justify-center py-4 group">
                    ¡CONSTRUIR PUZZLE! 
                    <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                        <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                    </div>
                </button>
            </div>

            <template v-else-if="gameState === 'playing'">
                <div v-if="selectedImage" class="puzzle-board-container shadow-2xl shrink-0 mt-2">
                  <img :src="getImageUrl(selectedImage.fileName)" class="absolute inset-0 w-full h-full object-cover" />
                  <div class="absolute inset-0 grid grid-cols-2 grid-rows-5">
                    <div v-for="(square, i) in squares" :key="i" @click="openChallenge(i)"
                      :class="['transition-all duration-700 border-[0.5px] border-indigo-100/30 flex items-center justify-center cursor-pointer', 
                               square.unlocked ? 'opacity-0 scale-125 pointer-events-none' : 'bg-slate-300/90 backdrop-blur-[2px] hover:bg-slate-200/80']">
                      <Lock v-if="!square.unlocked" class="w-8 h-8 text-slate-500 drop-shadow-sm" />
                    </div>
                  </div>
                </div>

                <div class="text-center px-4 uppercase shrink-0">
                    <p class="text-indigo-700 font-black text-sm tracking-widest animate-pulse">
                      Toca una pieza para desbloquear
                    </p>
                </div>
                <div class="h-4"></div>
            </template>

            <Transition name="pop">
              <div v-if="gameState === 'finished'" class="victory-overlay animate-fade-in uppercase">
                <SimpleConfetti v-if="showConfetti" />
                <Trophy class="w-20 h-20 text-amber-500 mb-4 drop-shadow-xl animate-bounce" />
                <h2 class="victory-title text-indigo-950 font-black italic">¡PUZZLE COMPLETADO!</h2>
                
                <div class="prize-card border-b-[10px] border-indigo-100">
                   <div class="flex justify-around items-center w-full">
                      <div class="prize-item"><img src="/images/coin-gold.png" /><span>+{{ sessionCoins.gold }}</span></div>
                      <div class="prize-item"><img src="/images/coin-silver.png" /><span>+{{ sessionCoins.silver }}</span></div>
                      <div class="prize-item"><img src="/images/coin-copper.png" /><span>+{{ sessionCoins.copper }}</span></div>
                   </div>
                </div>

                <div class="flex flex-col gap-4 w-full max-w-[280px]">
                    <button @click="startGame" 
                            class="w-full bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                                   text-white py-4 rounded-[1.5rem] font-black italic uppercase 
                                   border-b-[6px] border-[#1E3A8A] shadow-lg active:translate-y-[2px] active:border-b-[2px] transition-all">
                        NUEVA IMAGEN
                    </button>
                    <button @click="exitToPortal" class="text-slate-400 py-2 font-bold text-xs tracking-widest hover:text-indigo-600">SALIR AL PORTAL</button>
                </div>
              </div>
            </Transition>
        </div>

        <Transition name="pop">
          <div v-if="showMathModal" class="math-modal-overlay">
            <div class="math-card shadow-2xl">
              <button @click="showMathModal = false" class="btn-close-modal"><CloseIcon :size="16" /></button>
              <p class="modal-hint font-bold uppercase tracking-tighter opacity-50">Resuelve la pieza</p>
              <div class="math-expression">
                {{ challenge.a }} <span class="op-symbol text-indigo-500">{{ challenge.op }}</span> {{ challenge.b }}
              </div>
              <div class="answer-display-box w-full mb-4">
                <div :class="['answer-text', feedbackStatus]">
                  {{ userAnswer || '?' }}
                </div>
              </div>
              <VirtualKeyPad @press="handleKeyPress" @delete="handleDelete" class="mb-2" />
            </div>
          </div>
        </Transition>

    </main>
  </div>
</template>

<style scoped>
/* 🛡️ BLINDAJE TÉCNICO MASTER-CONTAINER v2.9.3 */
.master-container {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; justify-content: center; align-items: center;
    background-color: #ffffff; overflow: hidden;
    touch-action: none !important;
    height: 100dvh; top: 0; left: 0;
}

.app-canvas {
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden; transition: all 0.4s;
    user-select: none; width: 100vw; height: 100dvh;
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }

.header-puzzle {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9; z-index: 50;
}

.trophy-counter {
    display: flex; align-items: center; gap: 0.5rem;
    background: #fefce8; border: 2px solid #fef08a;
    padding: 4px 12px; border-radius: 12px;
}

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9;
}

.loot-indicator { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-indicator img { width: 1.2rem; height: 1.2rem; }
.loot-indicator span { font-weight: 900; color: #1e293b; }

.btn-close-puzzle { background: #fee2e2; color: #ef4444; width: 36px; height: 36px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

.puzzle-board-container {
    width: 90%; max-width: 320px; aspect-ratio: 4/5;
    background: white; border-radius: 1.5rem; position: relative;
    overflow: hidden; border: 6px solid white;
}

.rules-panel-puzzle { width: 92%; max-width: 400px; background: white; padding: 1.5rem; border-radius: 2rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #6366f1; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }

.victory-overlay {
    position: absolute; inset: 0; z-index: 300; background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2rem; text-align: center;
}
.victory-title { font-size: 2.2rem; line-height: 1; margin-bottom: 2rem; }

.prize-card { background: #f5f3ff; border: 4px solid #ede9fe; border-radius: 3rem; padding: 2rem; width: 100%; max-width: 280px; margin-bottom: 2rem; }
.prize-item { display: flex; flex-direction: column; align-items: center; }
.prize-item img { width: 2.5rem; height: 2.5rem; }
.prize-item span { font-size: 1.5rem; font-weight: 900; color: #4338ca; }

.math-modal-overlay { position: absolute; inset: 0; z-index: 250; background: rgba(30, 27, 75, 0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; height: 100dvh; }
.math-card { background-color: white; border-radius: 2.5rem; padding: 1.5rem; width: 100%; max-width: 320px; border-top: 8px solid #6366f1; display: flex; flex-direction: column; align-items: center; position: relative; }
.btn-close-modal { position: absolute; top: 1rem; right: 1rem; background: #f1f5f9; padding: 0.5rem; border-radius: 9999px; }
.math-expression { font-size: 3rem; font-weight: 900; color: #4338ca; font-style: italic; margin-bottom: 1rem; letter-spacing: -2px; }
.answer-text { width: 100%; text-align: center; font-size: 3rem; font-weight: 900; padding: 0.5rem 0; border-radius: 1.5rem; border: 4px solid #f1f5f9; background-color: #f8fafc; }
.answer-text.correct { background: #f0fdf4; border-color: #4ade80; color: #166534; }
.answer-text.error { background: #fef2f2; border-color: #f87171; color: #991b1b; animation: shake 0.3s; }

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>