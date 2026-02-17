<script setup>
import { ref, onUnmounted, computed } from 'vue';
import { X, Clock, Zap, Trophy, Medal, CheckCircle, XCircle } from 'lucide-vue-next';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// --- CONEXIÓN FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, increment } from "firebase/firestore";
// -------------------------

const emit = defineEmits(['close']);
const store = useGamificationStore();

const gameState = ref('menu'); // 'menu', 'playing', 'finished'
const selectedOperation = ref(null);

const totalQuestions = 10;
const currentQuestionIndex = ref(0);
const timeLeft = ref(60);
const score = ref(0);
const history = ref([]); 
const earned = ref({ silver: 0 }); // Solo plata para este nivel

const fallingCoins = ref([]); 

const currentQuestion = ref({
    text: '',
    correctAnswer: 0,
    options: []
});

let timerInterval = null;

const buttonColors = [
    'bg-red-500 hover:bg-red-600 shadow-[0_6px_0_rgb(185,28,28)] text-white',
    'bg-blue-500 hover:bg-blue-600 shadow-[0_6px_0_rgb(29,78,216)] text-white',
    'bg-yellow-400 hover:bg-yellow-500 shadow-[0_6px_0_rgb(202,138,4)] text-slate-900',
    'bg-green-500 hover:bg-green-600 shadow-[0_6px_0_rgb(21,128,61)] text-white'
];

const playSound = (type) => {
    try {
        const audio = new Audio(`/audios/${type}.mp3`);
        audio.play().catch(e => console.log("Audio no encontrado:", type));
    } catch (error) {}
};

const performanceFeedback = computed(() => {
    if (score.value === totalQuestions) return { text: "¡Perfección Absoluta! Eres un genio 🧠", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score.value >= 7) return { text: "¡Excelente trabajo! Muy buena velocidad 🚀", color: "text-green-600", bg: "bg-green-100" };
    if (score.value >= 4) return { text: "¡Vas bien! Pero puedes ser más rápido 👍", color: "text-blue-600", bg: "bg-blue-100" };
    return { text: "¡No te rindas! Sigue practicando para mejorar 💪", color: "text-orange-600", bg: "bg-orange-100" };
});

// --- FUNCIÓN PARA GUARDAR PLATA EN LA NUBE ---
const saveSilverToCloud = async (amount) => {
  const user = auth.currentUser;
  if (!user) return; 

  try {
    const userRef = doc(db, "users", user.uid);
    // Guardamos específicamente en "silver"
    await updateDoc(userRef, {
      "stats.silver": increment(amount),
      lastActivity: Date.now()
    });
    console.log(`☁️ +${amount} Plata guardada`);
  } catch (error) {
    console.error("Error guardando plata:", error);
  }
};
// ---------------------------------------------

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
        let deviation = Math.floor(Math.random() * 5) + 1;
        let isPlus = Math.random() > 0.5;
        let fake = isPlus ? correct + deviation : correct - deviation;
        if (fake >= 0 && fake !== correct) wrongAnswers.add(fake);
    }

    let allOptions = [correct, ...Array.from(wrongAnswers)];
    allOptions.sort(() => Math.random() - 0.5); 

    currentQuestion.value = { text: `${num1} ${op} ${num2}`, correctAnswer: correct, options: allOptions };
};

const handleTimeout = () => {
    playSound('wrong');
    history.value.push({ q: currentQuestion.value.text, chosen: '⏳ (Tiempo)', correct: currentQuestion.value.correctAnswer, isCorrect: false });
    currentQuestionIndex.value++;
    nextQuestion();
};

const checkAnswer = (answer) => {
    const isCorrect = (answer === currentQuestion.value.correctAnswer);
    if (isCorrect) {
        score.value++;
        playSound('correct');
    } else {
        playSound('wrong');
    }
    
    history.value.push({ q: currentQuestion.value.text, chosen: answer, correct: currentQuestion.value.correctAnswer, isCorrect: isCorrect });
    currentQuestionIndex.value++;
    nextQuestion();
};

const triggerCoinRain = (amount) => {
    for (let i = 0; i < amount; i++) {
        setTimeout(() => {
            fallingCoins.value.push({
                id: i,
                left: Math.random() * 90 + 5, 
                delay: Math.random() * 0.2
            });
        }, i * 150); 
    }
};

const endGame = () => {
    clearInterval(timerInterval);
    gameState.value = 'finished';
    playSound('finish');
    
    // --- LÓGICA ECONÓMICA (PLATA) ---
    let silverReward = 0;
    
    if (score.value === totalQuestions) {
        silverReward = 10; 
    } else if (score.value >= 7) {
        silverReward = 5;  
    } else {
        silverReward = 0; 
    }
    
    if (silverReward > 0) {
        // 1. Pago Local
        store.addCoins('silver', silverReward);
        // 2. Pago Nube
        saveSilverToCloud(silverReward);
        
        triggerCoinRain(silverReward * 2); 
    }
    
    earned.value = { silver: silverReward };
    speak(performanceFeedback.value.text);
};

const closeQuiz = () => {
    clearInterval(timerInterval);
    emit('close');
};

onUnmounted(() => clearInterval(timerInterval));
</script>

<template>
  <div class="absolute inset-0 z-50 bg-slate-50 flex flex-col font-sans text-slate-900 animate-fade-in overflow-hidden">
    
    <div v-for="coin in fallingCoins" :key="coin.id" class="absolute z-[60] w-10 h-10 pointer-events-none animate-coin-fall" :style="{ left: coin.left + '%', top: '-50px', animationDelay: coin.delay + 's' }">
        <img src="/images/coin-silver.png" class="w-full h-full drop-shadow-lg" />
    </div>

    <div class="flex justify-between items-center p-4 bg-indigo-600 shadow-md text-white shrink-0 z-10">
        <div class="flex items-center gap-2">
            <Zap class="text-yellow-400" fill="currentColor" />
            <h2 class="font-black text-lg tracking-wide uppercase">Desafío Contrarreloj</h2>
        </div>
        <button @click="closeQuiz" class="bg-white/20 p-2 rounded-full hover:bg-red-500 transition-colors">
            <X size="20" />
        </button>
    </div>

    <div v-if="gameState === 'menu'" class="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <div class="text-center mb-8">
            <h3 class="text-3xl font-black mb-2 text-indigo-900">10 Preguntas</h3>
            <p class="text-slate-500 font-bold text-lg">Tienes 60 segundos por pregunta.</p>
            <div class="mt-4 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl inline-block">
                <p class="text-blue-700 font-bold">🎯 ¡Acierta 10/10 para ganar <span class="font-black text-xl">10 Platas</span>!</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4 w-full max-w-md">
            <button @click="startGame('+')" class="bg-blue-500 hover:bg-blue-600 shadow-[0_6px_0_rgb(29,78,216)] text-white active:translate-y-1 active:shadow-none rounded-3xl p-6 flex flex-col items-center gap-2 transition-all">
                <span class="text-5xl font-black">+</span>
                <span class="font-bold text-sm uppercase tracking-widest">Sumar</span>
            </button>
            <button @click="startGame('-')" class="bg-red-500 hover:bg-red-600 shadow-[0_6px_0_rgb(185,28,28)] text-white active:translate-y-1 active:shadow-none rounded-3xl p-6 flex flex-col items-center gap-2 transition-all">
                <span class="text-5xl font-black">-</span>
                <span class="font-bold text-sm uppercase tracking-widest">Restar</span>
            </button>
            <button @click="startGame('x')" class="bg-green-500 hover:bg-green-600 shadow-[0_6px_0_rgb(21,128,61)] text-white active:translate-y-1 active:shadow-none rounded-3xl p-6 flex flex-col items-center gap-2 transition-all">
                <span class="text-5xl font-black">x</span>
                <span class="font-bold text-sm uppercase tracking-widest">Multiplicar</span>
            </button>
            <button @click="startGame('÷')" class="bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-[0_6px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none rounded-3xl p-6 flex flex-col items-center gap-2 transition-all">
                <span class="text-5xl font-black">÷</span>
                <span class="font-bold text-sm uppercase tracking-widest">Dividir</span>
            </button>
        </div>
    </div>

    <div v-else-if="gameState === 'playing'" class="flex-1 flex flex-col p-4 z-10">
        <div class="flex justify-between items-center mb-4 shrink-0">
            <div class="bg-white px-5 py-2 rounded-full flex items-center gap-2 border-2 border-slate-200 shadow-sm">
                <Trophy class="text-yellow-500" size="20" />
                <span class="text-xl font-black text-slate-700">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</span>
            </div>
            
            <div :class="`px-5 py-2 rounded-full flex items-center gap-2 border-2 shadow-sm transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-100 border-red-500 text-red-600 animate-pulse' : 'bg-white border-slate-200 text-slate-600'}`">
                <Clock size="20" />
                <span class="text-xl font-black tracking-wider">00:{{ timeLeft.toString().padStart(2, '0') }}</span>
            </div>
        </div>

        <div class="flex-1 flex items-center justify-center bg-white rounded-3xl border-4 border-indigo-100 mb-4 shadow-lg">
            <h1 class="text-7xl sm:text-8xl font-black tracking-tighter text-indigo-900">{{ currentQuestion.text }}</h1>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4 h-64 shrink-0">
            <button v-for="(option, index) in currentQuestion.options" :key="index"
                @click="checkAnswer(option)"
                :class="`rounded-2xl text-4xl sm:text-5xl font-black active:translate-y-1 active:shadow-none transition-all ${buttonColors[index]}`">
                {{ option }}
            </button>
        </div>
    </div>

    <div v-else-if="gameState === 'finished'" class="flex-1 flex flex-col p-4 bg-slate-100 overflow-hidden z-10">
        
        <div class="text-center mb-2 shrink-0">
            <Medal size="50" class="text-yellow-500 mx-auto mb-1" />
            <h2 class="text-2xl font-black uppercase tracking-widest text-indigo-900">¡Resultados!</h2>
            <div :class="`mt-2 px-4 py-2 rounded-xl inline-block ${performanceFeedback.bg}`">
                <p :class="`font-black text-sm ${performanceFeedback.color}`">{{ performanceFeedback.text }}</p>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-white rounded-2xl border-2 border-slate-200 shadow-inner p-2 my-2">
            <div v-for="(item, index) in history" :key="index" 
                class="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                
                <div class="flex items-center gap-3">
                    <span class="font-black text-slate-400 text-sm">{{ index + 1 }}.</span>
                    <span class="font-black text-xl text-slate-700">{{ item.q }} = <span :class="item.isCorrect ? 'text-green-600' : 'text-red-500'">{{ item.chosen }}</span></span>
                </div>
                
                <div class="flex items-center gap-2">
                    <CheckCircle v-if="item.isCorrect" class="text-green-500" size="28" />
                    <div v-else class="flex items-center gap-2">
                        <span class="text-lg font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">Era {{ item.correct }}</span>
                        <XCircle class="text-red-500" size="28" />
                    </div>
                </div>

            </div>
        </div>

        <div class="bg-indigo-50 rounded-2xl p-4 border-2 border-indigo-100 shrink-0 mb-3 flex justify-between items-center">
            <p class="text-indigo-900 font-black uppercase text-sm">Premio Final:</p>
            <div class="flex gap-4">
                <div v-if="earned.silver > 0" class="flex items-center gap-2 font-black text-slate-700 text-2xl animate-bounce">
                    +{{ earned.silver }} <img src="/images/coin-silver.png" class="w-8 h-8 drop-shadow-md" />
                </div>
                <div v-else class="font-black text-slate-400 text-sm">¡Necesitas 7 aciertos para ganar plata!</div>
            </div>
        </div>

        <div class="flex gap-3 shrink-0">
            <button @click="gameState = 'menu'" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl shadow-[0_4px_0_rgb(203,213,225)] active:translate-y-1 active:shadow-none transition-all">
                Volver
            </button>
            <button @click="startGame(selectedOperation)" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all">
                Reintentar
            </button>
        </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.animate-coin-fall {
    animation: coinFall 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
@keyframes coinFall {
    0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}
</style>