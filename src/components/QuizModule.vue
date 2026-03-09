<script setup>
/** * ARCHIVO: QuizModule.vue
 * NOTA INTERNA: ESTRUCTURA MAESTRA v2.9.2 + NAVEGACIÓN QUIRÚRGICA
 * LOGICA: Desafío contra reloj + Monedas de Sesión
 */
import { ref, onUnmounted, computed, onMounted } from 'vue';
import { X, Clock, Zap, Trophy, Medal, CheckCircle, XCircle, PlayCircle } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const emit = defineEmits(['close']);
const store = useGamificationStore();

const gameState = ref('rules'); // 'rules' | 'menu' | 'playing' | 'finished'
const selectedOperation = ref(null);
const totalQuestions = 10;
const currentQuestionIndex = ref(0);
const timeLeft = ref(60);
const score = ref(0);
const history = ref([]); 
const earned = ref({ gold: 0, silver: 0, copper: 0 }); 
const fallingCoins = ref([]); 

// Lógica de Monedas de Sesión
const sessionCoins = ref({ gold: 0, silver: 0, copper: 0 });

const currentQuestion = ref({ text: '', correctAnswer: 0, options: [] });
let timerInterval = null;

const quizButtons = [
    { s: '+', l: 'Sumar', c: 'bg-blue-500 shadow-[0_6px_0_rgb(29,78,216)]' },
    { s: '-', l: 'Restar', c: 'bg-red-500 shadow-[0_6px_0_rgb(185,28,28)]' },
    { s: 'x', l: 'Multiplicar', c: 'bg-green-500 shadow-[0_6px_0_rgb(21,128,61)]' },
    { s: '÷', l: 'Dividir', c: 'bg-yellow-400 text-slate-900 shadow-[0_6px_0_rgb(202,138,4)]' }
];

const buttonColors = [
    'bg-red-500 hover:bg-red-600 shadow-[0_6px_0_rgb(185,28,28)] text-white',
    'bg-blue-500 hover:bg-blue-600 shadow-[0_6px_0_rgb(29,78,216)] text-white',
    'bg-yellow-400 hover:bg-yellow-500 shadow-[0_6px_0_rgb(202,138,4)] text-slate-900',
    'bg-green-500 hover:bg-green-600 shadow-[0_6px_0_rgb(21,128,61)] text-white'
];

const playSound = (type) => {
    try { const audio = new Audio(`/audios/${type}.mp3`); audio.play().catch(() => {}); } catch (e) {}
};

const performanceFeedback = computed(() => {
    if (score.value === totalQuestions) return { text: "¡Perfección Absoluta! 🧠", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score.value >= 7) return { text: "¡Excelente trabajo! 🚀", color: "text-green-600", bg: "bg-green-100" };
    return { text: "¡Sigue practicando! 💪", color: "text-red-600", bg: "bg-red-100" };
});

const startGame = (operation) => {
    selectedOperation.value = operation;
    score.value = 0; currentQuestionIndex.value = 0;
    history.value = []; fallingCoins.value = [];
    sessionCoins.value = { gold: 0, silver: 0, copper: 0 };
    earned.value = { gold: 0, silver: 0, copper: 0 };
    gameState.value = 'playing';
    speak("¡Comencemos!");
    nextQuestion();
};

const nextQuestion = () => {
    if (currentQuestionIndex.value >= totalQuestions) { endGame(); return; }
    generateQuestion();
    timeLeft.value = 60; 
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft.value--;
        if (timeLeft.value <= 0) handleTimeout();
    }, 1000);
};

const generateQuestion = () => {
    let num1, num2, correct;
    const op = selectedOperation.value;
    if (op === '+') { num1 = Math.floor(Math.random() * 20) + 1; num2 = Math.floor(Math.random() * 20) + 1; correct = num1 + num2; }
    else if (op === '-') { num1 = Math.floor(Math.random() * 20) + 10; num2 = Math.floor(Math.random() * num1); correct = num1 - num2; }
    else if (op === 'x') { num1 = Math.floor(Math.random() * 10) + 1; num2 = Math.floor(Math.random() * 10) + 1; correct = num1 * num2; }
    else { num2 = Math.floor(Math.random() * 10) + 1; correct = Math.floor(Math.random() * 10) + 1; num1 = correct * num2; }
    let wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
        let fake = correct + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
        if (fake >= 0 && fake !== correct) wrongAnswers.add(fake);
    }
    let allOptions = [correct, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);
    currentQuestion.value = { text: `${num1} ${op} ${num2}`, correctAnswer: correct, options: allOptions };
};

const handleTimeout = () => {
    playSound('wrong');
    history.value.push({ q: currentQuestion.value.text, chosen: '⏳', correct: currentQuestion.value.correctAnswer, isCorrect: false });
    currentQuestionIndex.value++;
    nextQuestion();
};

const checkAnswer = (answer) => {
    const isCorrect = (answer === currentQuestion.value.correctAnswer);
    if (isCorrect) { 
        score.value++; 
        if (selectedOperation.value === '+') sessionCoins.value.copper++;
        else if (selectedOperation.value === '-') sessionCoins.value.silver++;
        else sessionCoins.value.gold++;
        playSound('correct'); 
    } else { playSound('wrong'); }
    history.value.push({ q: currentQuestion.value.text, chosen: answer, correct: currentQuestion.value.correctAnswer, isCorrect });
    currentQuestionIndex.value++;
    nextQuestion();
};

const triggerCoinRain = (type, amount) => {
    for (let i = 0; i < Math.min(amount * 2, 30); i++) {
        setTimeout(() => {
            fallingCoins.value.push({ id: Date.now() + i, left: Math.random() * 90 + 5, delay: Math.random() * 0.2, img: `/images/coin-${type}.png` });
        }, i * 100); 
    }
};

const endGame = async () => {
    clearInterval(timerInterval);
    gameState.value = 'finished';
    playSound('finish');
    earned.value = { ...sessionCoins.value };
    try {
        if (earned.value.gold > 0) await store.addCoins('gold', earned.value.gold);
        if (earned.value.silver > 0) await store.addCoins('silver', earned.value.silver);
        if (earned.value.copper > 0) await store.addCoins('copper', earned.value.copper);
        await store.updateMissionProgress('play_quiz', 1); 
    } catch (e) { console.error(e); }
    const coinType = selectedOperation.value === '+' ? 'copper' : selectedOperation.value === '-' ? 'silver' : 'gold';
    triggerCoinRain(coinType, earned.value[coinType]);
    speak(performanceFeedback.value.text);
};

// Quirúrgico: Lógica de retorno según estado
const closeQuiz = () => { 
    clearInterval(timerInterval); 
    if (gameState.value === 'rules') {
        emit('close'); 
    } else {
        gameState.value = 'rules';
    }
};

onMounted(() => { document.body.style.overflow = 'hidden'; });
onUnmounted(() => clearInterval(timerInterval));
</script>

<template>
  <div class="master-container">
    <main class="app-canvas !bg-slate-50 shadow-smartphone">
        <div v-for="coin in fallingCoins" :key="coin.id" class="absolute z-[60] w-12 h-12 pointer-events-none animate-coin-fall" :style="{ left: coin.left + '%', top: '-50px', animationDelay: coin.delay + 's' }">
            <img :src="coin.img" class="w-full h-full drop-shadow-lg" />
        </div>

        <header v-if="gameState !== 'rules'" class="header-standard sticky top-0 z-50 shrink-0">
            <div class="trophy-section">
                <Trophy size="22" class="text-yellow-500" />
                <span class="text-xl font-black text-indigo-900">{{ currentQuestionIndex + (gameState === 'finished' ? 0 : 1) }}/10</span>
            </div>
            <div class="session-loot-capsule">
                <div class="loot-item"><img src="/images/coin-gold.png" /><span>{{ sessionCoins.gold }}</span></div>
                <div class="loot-item border-x border-slate-100"><img src="/images/coin-silver.png" /><span>{{ sessionCoins.silver }}</span></div>
                <div class="loot-item"><img src="/images/coin-copper.png" /><span>{{ sessionCoins.copper }}</span></div>
            </div>
            <button @click="closeQuiz" class="btn-close-circle"><X size="20" /></button>
        </header>

        <div class="content-wrapper flex-1 flex flex-col overflow-hidden relative">
            
            <div v-if="gameState === 'rules'" class="flex-1 flex flex-col items-center justify-between p-6 animate-fade-in relative">
                <button @click="closeQuiz" class="absolute top-4 right-4 bg-slate-200/50 w-10 h-10 rounded-full flex items-center justify-center text-slate-600 active:scale-75 transition-all z-50">
                    <X size="24" />
                </button>

                <div class="flex flex-col items-center mt-6">
                    <Zap size="60" class="text-indigo-600 animate-bounce mb-2" />
                    <h1 class="game-title text-3xl">QUIZ TIME</h1>
                </div>

                <div class="rules-panel shadow-xl w-full">
                    <div class="rules-badge">MANUAL DE MISIÓN</div>
                    <ul class="p-5 space-y-5 text-slate-600 font-bold list-none">
                        <li class="flex gap-4">⏱️ <span class="text-sm">Responde 10 preguntas antes de que el tiempo se agote.</span></li>
                        <li class="flex gap-4">🎯 <span class="text-sm">Cada acierto suma monedas directamente a tu botín.</span></li>
                        <li class="flex gap-4">💰 <span class="text-sm">Suma: 🥉 | Resta: 🥈 | Mult/Div: 🥇</span></li>
                    </ul>
                </div>

                <button @click="gameState = 'menu'" class="bg-indigo-600 text-white w-full py-5 rounded-3xl font-black text-xl shadow-[0_6px_0_rgb(49,46,129)] active:translate-y-1 transition-all uppercase italic">
                    ¡ENTENDIDO!
                </button>
            </div>

            <div v-else-if="gameState === 'menu'" class="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in w-full overflow-y-auto scroll-interno">
                <div class="text-center mb-8">
                    <h3 class="text-4xl font-black text-indigo-900 uppercase italic">Elige tu Reto</h3>
                </div>
                <div class="grid grid-cols-2 gap-4 w-full px-2 max-w-2xl">
                    <button v-for="btn in quizButtons" :key="btn.s" @click="startGame(btn.s)" :class="`active:translate-y-1 rounded-3xl p-6 flex flex-col items-center gap-2 transition-all text-white ${btn.c}`">
                        <span class="text-6xl font-black">{{ btn.s }}</span><span class="font-bold text-xs uppercase tracking-widest">{{ btn.l }}</span>
                    </button>
                </div>
            </div>

            <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col p-4 animate-fade-in w-full justify-center gap-6 overflow-hidden">
                <div class="flex justify-center">
                    <div :class="`px-4 py-1.5 rounded-full flex items-center gap-2 border-2 shadow-sm ${timeLeft <= 10 ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' : 'bg-white text-slate-600'}`">
                        <Clock size="18" /><span>00:{{ timeLeft.toString().padStart(2, '0') }}</span>
                    </div>
                </div>
                
                <div class="question-box h-1/3 min-h-[160px] flex items-center justify-center bg-blue-50 rounded-[40px] border-4 border-blue-100 shadow-sm text-indigo-900">
                    <h1 class="text-6xl sm:text-7xl font-black text-center tracking-tighter">{{ currentQuestion.text }}</h1>
                </div>

                <div class="grid grid-cols-2 gap-3 flex-1 max-h-[320px] pb-2 max-w-2xl mx-auto w-full">
                    <button v-for="(option, idx) in currentQuestion.options" :key="idx" @click="checkAnswer(option)" :class="`rounded-3xl text-4xl font-black active:translate-y-1 transition-all ${buttonColors[idx]}`">{{ option }}</button>
                </div>
            </div>

            <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col p-4 bg-slate-50 animate-fade-in w-full h-full overflow-hidden">
                <div class="text-center mb-4 shrink-0">
                    <Medal size="48" class="text-yellow-500 mx-auto mb-2" /><h2 class="text-2xl font-black text-indigo-900 uppercase italic">¡Reto Terminado!</h2>
                    <div :class="`mt-1 px-4 py-1 rounded-full inline-block ${performanceFeedback.bg}`">
                        <p :class="`font-black text-xs ${performanceFeedback.color}`">{{ performanceFeedback.text }}</p>
                    </div>
                </div>
                <div class="flex-1 bg-white rounded-3xl border-2 border-slate-200 shadow-inner p-4 my-2 overflow-y-auto scroll-interno">
                    <div v-for="(item, idx) in history" :key="idx" class="flex items-center justify-between py-2 border-b border-slate-50 px-2 text-base font-black">
                        <div class="flex items-center gap-3"><span class="text-slate-400 text-xs">{{ idx + 1 }}.</span><span>{{ item.q }} = <span :class="item.isCorrect ? 'text-green-600' : 'text-red-500'">{{ item.chosen }}</span></span></div>
                        <CheckCircle v-if="item.isCorrect" class="text-green-500" size="20" /><XCircle v-else class="text-red-500" size="20" />
                    </div>
                </div>
                <div class="flex gap-4 pb-6 mt-4 shrink-0">
                    <button @click="gameState = 'menu'" class="flex-1 bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl uppercase tracking-widest">Menú</button>
                    <button @click="startGame(selectedOperation)" class="flex-1 bg-green-500 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-1 uppercase tracking-widest italic">¡Otro!</button>
                </div>
            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* LEY DE HIERRO v2.9.2 - DESAFÍO CONTRA RELOJ */

.master-container {
    position: fixed; inset: 0;
    width: 100vw; height: 100dvh;
    display: flex; justify-content: center; align-items: center;
    background-color: #ffffff;
    z-index: 9999; overflow: hidden;
    touch-action: none !important;
}

.app-canvas {
    display: flex; flex-direction: column;
    justify-content: space-between;
    position: relative; overflow: hidden;
    background: #f8fafc;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    touch-action: none !important;
    -webkit-tap-highlight-color: transparent;
    width: 100vw; height: 100dvh;
}

@media (min-width: 1025px) {
    .app-canvas {
        width: 1024px; height: 90dvh;
        border-radius: 45px;
        box-shadow: 0 40px 100px rgba(0,0,0,0.15);
        border: 8px solid white;
    }
}

@media (min-width: 600px) and (max-width: 1024px) {
    .app-canvas { width: 85vw; height: 95dvh; border-radius: 35px; }
}

.header-standard {
    width: 100%; display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1.25rem; background: white; border-bottom: 2px solid #f1f5f9;
}

.session-loot-capsule {
    display: flex; align-items: center; background: white; padding: 6px 16px;
    border-radius: 9999px; border: 2px solid #f1f5f9;
}

.loot-item { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.loot-item img { width: 1.2rem; height: 1.2rem; object-fit: contain; }
.loot-item span { font-weight: 900; color: #1e293b; font-size: 1rem; }

.btn-close-circle { 
    background: #fee2e2; color: #ef4444; width: 36px; height: 36px; 
    border-radius: 9999px; display: flex; align-items: center; justify-content: center;
}

.game-title { font-weight: 900; color: #312e81; text-transform: uppercase; font-style: italic; letter-spacing: -0.05em; }

.rules-panel {
    width: 92%; background: white; padding: 1rem; border-radius: 2rem;
    border: 2px solid #e2e8f0; position: relative;
}

.rules-badge {
    position: absolute; top: -10px; left: 1.5rem; background: #4f46e5;
    color: white; font-size: 10px; font-weight: 900; padding: 2px 12px; border-radius: 9999px;
}

.scroll-interno { overflow-y: auto; -webkit-overflow-scrolling: touch; }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-coin-fall { animation: coinFall 2s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
@keyframes coinFall { 0% { transform: translateY(-50px) rotate(0deg); opacity: 1; } 100% { transform: translateY(110dvh) rotate(360deg); opacity: 0; } }
</style>