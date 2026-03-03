<script setup>
import { ref, onUnmounted, computed, onMounted } from 'vue';
import { X, Clock, Zap, Trophy, Medal, CheckCircle, XCircle } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const emit = defineEmits(['close']);
const store = useGamificationStore();

const gameState = ref('menu'); // 'menu', 'playing', 'finished'
const selectedOperation = ref(null);

const totalQuestions = 10;
const currentQuestionIndex = ref(0);
const timeLeft = ref(60);
const score = ref(0);
const history = ref([]); 
const earned = ref({ silver: 0 }); 
const fallingCoins = ref([]); 

const currentQuestion = ref({
    text: '',
    correctAnswer: 0,
    options: []
});

let timerInterval = null;

// Botones de categorías
const quizButtons = [
    { s: '+', l: 'Sumar', c: 'bg-blue-500 shadow-[0_6px_0_rgb(29,78,216)]' },
    { s: '-', l: 'Restar', c: 'bg-red-500 shadow-[0_6_0_rgb(185,28,28)]' },
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
    try {
        const audio = new Audio(`/audios/${type}.mp3`);
        audio.play().catch(() => {});
    } catch (error) {}
};

const performanceFeedback = computed(() => {
    if (score.value === totalQuestions) return { text: "¡Perfección Absoluta! 🧠", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score.value >= 7) return { text: "¡Excelente velocidad! 🚀", color: "text-green-600", bg: "bg-green-100" };
    if (score.value >= 4) return { text: "¡Vas bien! 👍", color: "text-blue-600", bg: "bg-blue-100" };
    return { text: "¡Sigue practicando! 💪", color: "text-orange-600", bg: "bg-orange-100" };
});

const startGame = (operation) => {
    selectedOperation.value = operation;
    score.value = 0;
    currentQuestionIndex.value = 0;
    history.value = [];
    fallingCoins.value = [];
    gameState.value = 'playing';
    speak("¡Comencemos!");
    nextQuestion();
};

const nextQuestion = () => {
    if (currentQuestionIndex.value >= totalQuestions) {
        endGame();
        return;
    }
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
    if (op === '+') {
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        correct = num1 + num2;
    } else if (op === '-') {
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * num1); 
        correct = num1 - num2;
    } else if (op === 'x') {
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        correct = num1 * num2;
    } else if (op === '÷') {
        num2 = Math.floor(Math.random() * 10) + 1;
        correct = Math.floor(Math.random() * 10) + 1;
        num1 = correct * num2; 
    }

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
    if (isCorrect) { score.value++; playSound('correct'); } else { playSound('wrong'); }
    history.value.push({ q: currentQuestion.value.text, chosen: answer, correct: currentQuestion.value.correctAnswer, isCorrect: isCorrect });
    currentQuestionIndex.value++;
    nextQuestion();
};

const triggerCoinRain = (amount) => {
    for (let i = 0; i < Math.min(amount * 2, 30); i++) {
        setTimeout(() => {
            fallingCoins.value.push({ id: Date.now() + i, left: Math.random() * 90 + 5, delay: Math.random() * 0.2 });
        }, i * 100); 
    }
};

const endGame = async () => {
    clearInterval(timerInterval);
    gameState.value = 'finished';
    playSound('finish');
    
    let silverReward = score.value >= 7 ? 10 : 5;
    
    try {
        await store.addCoins('silver', silverReward); 
        await store.updateMissionProgress('play_quiz', 1); 
        if (window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (e) {
        console.error(e);
    }
    
    triggerCoinRain(silverReward); 
    earned.value = { silver: silverReward };
    speak(performanceFeedback.value.text);
};

const closeQuiz = () => { 
    clearInterval(timerInterval); 
    if (gameState.value === 'playing' || gameState.value === 'finished') {
        gameState.value = 'menu';
    } else {
        emit('close'); 
    }
};

onMounted(() => {
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => clearInterval(timerInterval));
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans text-slate-900 animate-fade-in overflow-hidden overscroll-none touch-none h-[100dvh] w-full">
    
    <div v-for="coin in fallingCoins" :key="coin.id" class="absolute z-[60] w-10 h-10 pointer-events-none animate-coin-fall" :style="{ left: coin.left + '%', top: '-50px', animationDelay: coin.delay + 's' }">
        <img src="/images/coin-silver.png" class="w-full h-full drop-shadow-lg" />
    </div>

    <div class="flex justify-between items-center p-3 bg-indigo-600 shadow-md text-white shrink-0 z-10 uppercase">
        <div class="flex items-center gap-2">
            <Zap class="text-yellow-400" fill="currentColor" :size="20" />
            <h2 class="font-black text-base tracking-wide">Contra Reloj</h2>
        </div>
        <button @click="closeQuiz" class="bg-white/20 p-2 rounded-full active:scale-90 transition-transform">
            <X size="20" />
        </button>
    </div>

    <div v-if="gameState === 'menu'" class="flex-1 flex flex-col items-center justify-center p-6 z-10 animate-fade-in max-w-md mx-auto w-full overflow-hidden">
        <div class="text-center mb-6 shrink-0">
            <h3 class="text-3xl font-black mb-1 text-indigo-900">10 Preguntas</h3>
            <p class="text-slate-500 font-bold text-base italic">¡Gana monedas de plata!</p>
        </div>

        <div class="grid grid-cols-2 gap-3 w-full shrink-0">
            <button v-for="btn in quizButtons" :key="btn.s" @click="startGame(btn.s)" 
                :class="`active:translate-y-1 active:shadow-none rounded-3xl p-5 flex flex-col items-center gap-1 transition-all text-white ${btn.c}`">
                <span class="text-4xl font-black">{{ btn.s }}</span>
                <span class="font-bold text-[10px] uppercase tracking-widest">{{ btn.l }}</span>
            </button>
        </div>

        <div class="mt-6 flex flex-col gap-2 w-full shrink-0">
            <div class="bg-green-50 border-2 border-green-200 py-2 px-4 rounded-2xl text-green-700 font-bold text-xs flex justify-between items-center">
                <span>🎯 7+ aciertos:</span> <span class="font-black text-base text-green-800">10 Platas</span>
            </div>
            <div class="bg-blue-50 border-2 border-blue-200 py-2 px-4 rounded-2xl text-blue-700 font-bold text-xs flex justify-between items-center">
                <span>👍 Menos de 7:</span> <span class="font-black text-base text-blue-800">5 Platas</span>
            </div>
        </div>
    </div>

    <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col p-4 z-10 animate-fade-in max-w-md mx-auto w-full overflow-hidden">
        <div class="flex justify-between items-center mb-3 shrink-0 uppercase font-black px-1">
            <div class="bg-white px-4 py-2 rounded-full flex items-center gap-2 border-2 border-slate-200 shadow-sm text-slate-700">
                <Trophy class="text-yellow-500" size="18" />
                <span class="text-lg">{{ currentQuestionIndex + 1 }} / 10</span>
            </div>
            <div :class="`px-4 py-2 rounded-full flex items-center gap-2 border-2 shadow-sm transition-all ${timeLeft <= 10 ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-600'}`">
                <Clock size="18" />
                <span class="text-lg tracking-wider">00:{{ timeLeft.toString().padStart(2, '0') }}</span>
            </div>
        </div>

        <div class="flex-1 flex items-center justify-center bg-white rounded-3xl border-4 border-indigo-100 mb-4 shadow-lg text-indigo-900 min-h-0 relative">
            <h1 class="text-6xl sm:text-7xl font-black tracking-tighter">{{ currentQuestion.text }}</h1>
        </div>

        <div class="grid grid-cols-2 gap-3 h-56 shrink-0 pb-2">
            <button v-for="(option, idx) in currentQuestion.options" :key="idx" @click="checkAnswer(option)"
                :class="`rounded-2xl text-4xl font-black active:translate-y-1 active:shadow-none transition-all ${buttonColors[idx]}`">
                {{ option }}
            </button>
        </div>
    </div>

    <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col p-4 bg-slate-100 overflow-hidden z-10 animate-fade-in max-w-md mx-auto w-full h-full">
        <div class="text-center mb-2 shrink-0">
            <Medal size="40" class="text-yellow-500 mx-auto mb-1" />
            <h2 class="text-xl font-black text-indigo-900 uppercase leading-none">¡Resultados!</h2>
            <div :class="`mt-2 px-3 py-1 rounded-xl inline-block ${performanceFeedback.bg}`">
                <p :class="`font-black text-xs ${performanceFeedback.color}`">{{ performanceFeedback.text }}</p>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-white rounded-2xl border-2 border-slate-200 shadow-inner p-2 my-2 overscroll-contain scrollbar-hide">
            <div v-for="(item, idx) in history" :key="idx" class="flex items-center justify-between p-2 border-b border-slate-50 last:border-0">
                <div class="flex items-center gap-2">
                    <span class="font-black text-slate-400 text-[10px]">{{ idx + 1 }}.</span>
                    <span class="font-black text-lg text-slate-700">{{ item.q }} = 
                        <span :class="item.isCorrect ? 'text-green-600' : 'text-red-500'">{{ item.chosen }}</span>
                    </span>
                </div>
                <div class="flex items-center gap-2 font-black">
                    <CheckCircle v-if="item.isCorrect" class="text-green-500" size="24" />
                    <template v-else>
                        <span class="text-xs text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded border border-slate-100">{{ item.correct }}</span>
                        <XCircle class="text-red-500" size="24" />
                    </template>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl p-3 border-2 border-indigo-100 shrink-0 mb-3 flex justify-between items-center text-slate-700 shadow-sm">
            <p class="font-black uppercase text-[10px]">Tu Premio:</p>
            <div class="flex items-center gap-2 font-black text-xl text-indigo-600">
                +{{ earned.silver }} <img src="/images/coin-silver.png" class="w-6 h-6" />
            </div>
        </div>

        <div class="flex gap-2 shrink-0 pb-4">
            <button @click="gameState = 'menu'" class="flex-1 bg-slate-200 text-slate-700 font-bold py-3 rounded-xl shadow-[0_4px_0_rgb(203,213,225)] uppercase text-[10px]">Menú</button>
            <button @click="startGame(selectedOperation)" class="flex-1 bg-green-500 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] uppercase text-[10px]">¡Otra vez!</button>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-coin-fall { animation: coinFall 2s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
@keyframes coinFall { 0% { transform: translateY(-50px) rotate(0deg); opacity: 1; } 100% { transform: translateY(110dvh) rotate(360deg); opacity: 0; } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>