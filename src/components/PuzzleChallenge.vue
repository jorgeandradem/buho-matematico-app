<script setup>
/** * ARCHIVO: ROMPECABEZAS MATE - PuzzleChallenge.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v4.2 - CONSOLIDACIÓN MOTOR DE VOZ FINAL
 * LOGICA: Silencio absoluto en juego. Locución quirúrgica en reglas y premiación.
 */
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { puzzleImages } from '../data/puzzleImages';
import { 
    Lock, Trophy, X as CloseIcon, Sparkles, BookOpen, PlayCircle, 
    MousePointer2, ChevronRight, RotateCcw, Volume2 
} from 'lucide-vue-next';
import SimpleConfetti from './SimpleConfetti.vue';
import CoinRain from './CoinRain.vue';
import VirtualKeyPad from './VirtualKeypad.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { playOwlHoot, playCoinSound } from '../utils/sound';

const emit = defineEmits(['close', 'win']);
const gamificationStore = useGamificationStore();

// --- 🔊 MOTOR DE VOZ UNIFICADO (Web Speech API) ---
const speak = (text, mood = 'intro') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    // Configuración de estados según Compendio Maestro
    if (mood === 'gold') {
        utterance.pitch = 1.4; // Entusiasta y aguda
        utterance.rate = 1.1;
    } else if (mood === 'silver') {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
    } else if (mood === 'copper') {
        utterance.pitch = 0.8; // Grave y pausada (aliento)
        utterance.rate = 0.9;
    } else {
        // Modo 'intro' o instrucciones
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
    }

    window.speechSynthesis.speak(utterance);
};

// Función para narrar las instrucciones iniciales
const vocalizeRules = () => {
    speak("¡A construir el puzzle! Toca cualquier pieza gris para revelar un reto matemático. Resuelve la operación correctamente para desbloquear la imagen oculta. ¡Suma cobre, resta plata y multiplica o divide para ganar oro!");
};

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

// --- ⚡ ESTRATEGIA DE AUDIO (WATCHERS) ---
watch(gameState, (newState) => {
    if (newState === 'rules') {
        vocalizeRules();
    }
});

// NOTA: Se ha eliminado el watch sobre showMathModal para garantizar el SILENCIO EN JUEGO.

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
        // SILENCIO EN JUEGO: Se elimina el speak de error "Oh no"
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
        
        gamificationStore.updateMissionProgress('play_any_game', 1);

        let mood = 'gold';
        if (totalErrors.value > 6) mood = 'copper';
        else if (totalErrors.value > 2) mood = 'silver';

        if (totalErrors.value > 6) {
            sessionCoins.value.gold = Math.min(sessionCoins.value.gold, 5);
            sessionCoins.value.silver = Math.min(sessionCoins.value.silver, 5);
            sessionCoins.value.copper = Math.min(sessionCoins.value.copper, 5);
        }

        // Vocalización de Salida: Narra premio y botín
        const finalMsg = `¡Puzzle completado! Has ganado un botín de ${sessionCoins.value.gold} monedas de oro, ${sessionCoins.value.silver} de plata y ${sessionCoins.value.copper} de cobre. ¡Excelente trabajo, arquitecto!`;
        speak(finalMsg, mood);

        await gamificationStore.addCoins('gold', sessionCoins.value.gold);
        await gamificationStore.addCoins('silver', sessionCoins.value.silver);
        await gamificationStore.addCoins('copper', sessionCoins.value.copper);
        emit('win', { ...sessionCoins.value });
    }
};

onMounted(() => {
    if (gameState.value === 'rules') vocalizeRules();
});

onUnmounted(() => {
    window.speechSynthesis.cancel();
});
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas shadow-smartphone bg-gradient-to-br from-[#fdfbf7] via-[#f8f6f0] to-[#f3f0e6]">
        
        <CoinRain v-if="showCoinRain" type="gold" :count="40" class="z-[400]" />

        <header v-if="gameState !== 'rules'" class="header-standard shrink-0 bg-white/60 backdrop-blur-md">
            <div class="trophy-section">
                <Trophy size="20" class="text-yellow-500" />
                <span class="font-black text-lg text-indigo-900">{{ perfectAttempts }}/10</span>
            </div>

            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-200"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>

            <button @click="exitToPortal" class="btn-close-circle shadow-sm border border-red-200">
                <CloseIcon :size="20" />
            </button>
        </header>

        <div class="game-content flex-1 flex flex-col overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 w-full animate-fade-in z-10 overflow-y-auto">
                <button @click="exitToPortal" class="absolute top-4 right-4 bg-white/60 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all shadow-sm border border-slate-200">
                    <CloseIcon size="24" stroke-width="3" />
                </button>

                <div class="flex flex-col items-center mt-4">
                    <div class="puzzle-3d-epic animate-puzzle-float">
                        <div class="puzzle-shadow"></div>
                        <div class="puzzle-block block-blue">
                            <div class="knob knob-right"></div>
                            <div class="knob knob-bottom"></div>
                            <div class="glossy-shine"></div>
                        </div>
                        <div class="puzzle-block block-green">
                            <div class="hole hole-top"></div>
                            <div class="hole hole-left"></div>
                            <div class="knob knob-right"></div>
                            <div class="glossy-shine"></div>
                        </div>
                    </div>
                    <h1 class="game-title text-4xl uppercase italic font-black text-indigo-900 mt-2 drop-shadow-sm">PUZZLE MÁGICO</h1>
                </div>

                <div class="rules-panel-puzzle shadow-xl w-full bg-white/90 backdrop-blur-sm mt-4 shrink-0 relative">
                    <button @click="vocalizeRules" 
                            class="absolute -top-3 -right-3 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white">
                        <Volume2 size="24" />
                    </button>

                    <div class="rules-badge uppercase font-black tracking-widest">Manual del Constructor</div>
                    <div class="flex flex-col gap-3 p-2 mt-2">
                        <div class="flex gap-4 items-start">
                            <div class="bg-indigo-100 p-2 rounded-xl shrink-0"><MousePointer2 class="text-indigo-600" size="18" /></div>
                            <p class="text-xs font-bold text-slate-700 leading-tight">Toca cualquier **pieza gris** para revelar un reto matemático.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-green-100 p-2 rounded-xl shrink-0"><BookOpen class="text-green-600" size="18" /></div>
                            <p class="text-xs font-bold text-slate-700 leading-tight">Resuelve la operación correctamente para **desbloquear la imagen**.</p>
                        </div>
                        <div class="flex gap-4 items-start">
                            <div class="bg-amber-100 p-2 rounded-xl shrink-0"><Trophy class="text-amber-600" size="18" /></div>
                            <p class="text-xs font-bold text-slate-700 leading-tight">¡Suma cobre, Resta plata y Multi/Div gana oro! Completa las 10 piezas.</p>
                        </div>
                    </div>
                </div>

                <button @click="startGame" 
                        class="w-[90%] max-w-[420px] bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8] 
                               text-white font-black italic text-xl uppercase rounded-[2rem] 
                               border-b-[8px] border-[#1E3A8A] shadow-lg shadow-[#1D4ED8]/40 
                               active:translate-y-[4px] active:border-b-[4px] transition-all 
                               flex items-center justify-center py-4 group mt-4 mb-2 shrink-0">
                    ¡CONSTRUIR PUZZLE! 
                    <div class="ml-3 bg-white p-1 rounded-full flex items-center justify-center shadow-inner">
                        <ChevronRight class="text-[#1D4ED8]" size="20" stroke-width="4" />
                    </div>
                </button>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
                <div class="flex-1 flex flex-col items-center justify-center w-full min-h-0">
                    <div v-if="selectedImage" class="puzzle-board-container shadow-2xl relative w-full max-h-full">
                      <img :src="getImageUrl(selectedImage.fileName)" class="absolute inset-0 w-full h-full object-cover" />
                      <div class="absolute inset-0 grid grid-cols-2 grid-rows-5">
                        <div v-for="(square, i) in squares" :key="i" @click="openChallenge(i)"
                          :class="['transition-all duration-700 border-[0.5px] border-indigo-100/30 flex items-center justify-center cursor-pointer', 
                                   square.unlocked ? 'opacity-0 scale-125 pointer-events-none' : 'bg-slate-300/90 backdrop-blur-[2px] hover:bg-slate-200/80']">
                          <Lock v-if="!square.unlocked" class="w-8 h-8 text-slate-500 drop-shadow-sm" />
                        </div>
                      </div>
                    </div>
                </div>
                <div class="text-center px-4 uppercase shrink-0 mt-4 mb-2">
                    <p class="text-indigo-700 font-black text-sm tracking-widest animate-pulse">Toca una pieza para desbloquear</p>
                </div>
            </div>

            <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in uppercase bg-white/50 backdrop-blur-sm z-20">
                <SimpleConfetti v-if="showConfetti" />
                <Trophy class="w-24 h-24 text-amber-500 mb-4 drop-shadow-xl animate-bounce shrink-0" />
                <h2 class="victory-title text-indigo-950 font-black italic shrink-0">¡PUZZLE COMPLETADO!</h2>
                
                <div class="prize-card border-b-[10px] border-indigo-100 bg-white/70 backdrop-blur-md shadow-lg shrink-0">
                    <div class="flex justify-around items-center w-full">
                      <div class="prize-item"><img src="/images/coin-gold.png" /><span>+{{ sessionCoins.gold }}</span></div>
                      <div class="prize-item border-x border-slate-300 px-6"><img src="/images/coin-silver.png" /><span>+{{ sessionCoins.silver }}</span></div>
                      <div class="prize-item"><img src="/images/coin-copper.png" /><span>+{{ sessionCoins.copper }}</span></div>
                    </div>
                </div>

                <div class="flex flex-col gap-4 w-full max-w-[280px] shrink-0">
                    <button @click="startGame" class="btn-primary-action w-full !bg-emerald-500 !border-emerald-700">
                        NUEVA IMAGEN <RotateCcw size="20" class="ml-2" />
                    </button>
                    <button @click="exitToPortal" class="text-slate-500 py-2 font-bold text-xs tracking-widest hover:text-indigo-600 transition-colors">SALIR AL PORTAL</button>
                </div>
            </div>
        </div>

        <Transition name="pop">
          <div v-if="showMathModal" class="math-modal-overlay">
            <div class="math-card shadow-2xl">
              <button @click="showMathModal = false" class="btn-close-modal border border-slate-200 shadow-sm"><CloseIcon :size="20" stroke-width="3" class="text-slate-600" /></button>
              
              <p class="modal-hint font-bold uppercase tracking-tighter opacity-50 text-indigo-900">Resuelve la pieza</p>
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
/* (Mantenemos los estilos originales sin cambios para no romper el blindaje visual) */
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overflow: hidden; touch-action: none !important; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; transition: all 0.4s; user-select: none; width: 100vw; height: 100dvh; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.2); } }
.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid rgba(226, 232, 240, 0.6); z-index: 50; }
.trophy-section { display: flex; align-items: center; gap: 0.5rem; }
.session-loot-capsule { display: flex; align-items: center; background: white; padding: 6px 16px; border-radius: 9999px; border: 2px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-item img { width: 1.2rem; height: 1.2rem; }
.loot-item span { font-weight: 900; color: #1e293b; }
.btn-close-circle { background: white; color: #ef4444; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.puzzle-3d-epic { position: relative; width: 150px; height: 130px; margin-bottom: 1rem; transform: perspective(800px) rotateX(25deg) rotateY(-15deg); transform-style: preserve-3d; }
.puzzle-shadow { position: absolute; bottom: -15px; left: 20px; width: 110px; height: 35px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%); filter: blur(5px); }
.puzzle-block { position: absolute; width: 65px; height: 65px; border-radius: 12px; box-shadow: inset 4px 4px 8px rgba(255, 255, 255, 0.7), inset -5px -5px 12px rgba(0, 0, 0, 0.4), 6px 12px 18px rgba(0, 0, 0, 0.35); }
.block-blue { top: 10px; left: 15px; background: linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%); border: 1px solid #1e3a8a; z-index: 2; }
.block-green { top: 50px; left: 65px; background: linear-gradient(135deg, #4ade80 0%, #15803d 100%); border: 1px solid #14532d; z-index: 1; }
.knob { position: absolute; width: 26px; height: 26px; background: inherit; border-radius: 50%; box-shadow: inset 3px 3px 5px rgba(255,255,255,0.5), inset -3px -3px 6px rgba(0,0,0,0.4); }
.block-blue .knob-right { right: -13px; top: 19px; }
.block-blue .knob-bottom { bottom: -13px; left: 19px; }
.block-green .knob-right { right: -13px; top: 19px; }
.hole { position: absolute; width: 26px; height: 26px; background: #1e293b; border-radius: 50%; box-shadow: inset 4px 4px 6px rgba(0,0,0,0.8), inset -2px -2px 4px rgba(255,255,255,0.2); }
.block-green .hole-top { top: -11px; left: 19px; }
.block-green .hole-left { left: -11px; top: 19px; }
.glossy-shine { position: absolute; top: 2px; left: 2px; width: 80%; height: 40%; background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0)); border-radius: 10px 10px 20px 20px; pointer-events: none; }
.animate-puzzle-float { animation: puzzleFloat 4s ease-in-out infinite; }
@keyframes puzzleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.puzzle-board-container { width: 100%; max-width: 320px; aspect-ratio: 4/5; background: white; border-radius: 1.5rem; overflow: hidden; border: 6px solid white; margin: 0 auto;}
.rules-panel-puzzle { width: 92%; max-width: 400px; padding: 1.2rem; border-radius: 2rem; border: 2px solid rgba(226, 232, 240, 0.8); position: relative; }
.rules-badge { position: absolute; top: -12px; left: 1.5rem; background: #6366f1; color: white; font-size: 10px; font-weight: 900; padding: 4px 12px; border-radius: 9999px; }
.victory-title { font-size: 2rem; line-height: 1; margin-bottom: 1.5rem; }
.prize-card { border-radius: 2rem; padding: 1.5rem; width: 100%; max-width: 320px; margin-bottom: 1.5rem; border: 2px solid white;}
.prize-item { display: flex; flex-direction: column; align-items: center; }
.prize-item img { width: 2.2rem; height: 2.2rem; }
.prize-item span { font-size: 1.3rem; font-weight: 900; color: #4338ca; }
.math-modal-overlay { position: absolute; inset: 0; z-index: 350; background: rgba(30, 27, 75, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1.5rem; height: 100dvh; }
.math-card { background-color: white; border-radius: 2.5rem; padding: 1.5rem; width: 100%; max-width: 320px; border-top: 8px solid #6366f1; display: flex; flex-direction: column; align-items: center; position: relative; }
.btn-close-modal { position: absolute; top: 1rem; right: 1rem; background: white; padding: 0.5rem; border-radius: 9999px; }
.math-expression { font-size: 3rem; font-weight: 900; color: #4338ca; font-style: italic; margin-bottom: 1rem; letter-spacing: -2px; }
.answer-text { width: 100%; text-align: center; font-size: 3rem; font-weight: 900; padding: 0.5rem 0; border-radius: 1.5rem; border: 4px solid #f1f5f9; background-color: #f8fafc; }
.answer-text.correct { background: #f0fdf4; border-color: #4ade80; color: #166534; }
.answer-text.error { background: #fef2f2; border-color: #f87171; color: #991b1b; animation: shake 0.3s; }
.btn-primary-action { color: white; font-weight: 900; font-size: 1.2rem; padding: 1.2rem; border-radius: 1.5rem; border-bottom: 6px solid #1d4ed8; display: flex; align-items: center; justify-content: center; transition: 0.1s; cursor: pointer; }
.btn-primary-action:active { transform: translateY(3px); border-bottom-width: 2px; }
.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.pop-enter-active { animation: pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes pop-in { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
</style>