<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft, RefreshCw, Trophy, Coins } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// ✅ CENTRALIZACIÓN: Eliminamos importaciones de Firebase aquí para que el Store 
// maneje el "Escudo de Riqueza" de forma única.

const props = defineProps({
  operation: { type: String, default: 'add' }, 
  tableNumber: { type: [Number, String], default: 'random' }
});

const emit = defineEmits(['back']);
const gamificationStore = useGamificationStore();

const QUESTIONS_COUNT = 10; 

const currentQuestionIndex = ref(0);
const score = ref(0);
const showCoinRain = ref(false);
const isFinished = ref(false);
const currentQuestion = ref(null);
const options = ref([]);
const feedbackMessage = ref('');
const feedbackColor = ref('');

const generateQuestion = () => {
    let num1, num2, answer, symbol;
    const table = props.tableNumber === 'random' ? Math.floor(Math.random() * 9) + 2 : parseInt(props.tableNumber);
    
    if (props.operation === 'add') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 + num2; symbol = '+';
    } else if (props.operation === 'sub') {
        num2 = Math.floor(Math.random() * 10) + 1; answer = table; num1 = num2 + answer; symbol = '-';
    } else if (props.operation === 'mult') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 * num2; symbol = '×';
    } else if (props.operation === 'div') {
        answer = table; num2 = Math.floor(Math.random() * 9) + 2; num1 = answer * num2; symbol = '÷';
    }

    let opts = new Set([answer]);
    while (opts.size < 3) {
        let fake = answer + Math.floor(Math.random() * 10) - 5;
        if (fake > 0 && fake !== answer) opts.add(fake);
    }
    options.value = Array.from(opts).sort(() => Math.random() - 0.5);
    currentQuestion.value = { num1, num2, symbol, answer };
};

// ✅ CIRUGÍA: Convertimos a función asíncrona para asegurar la racha.
const selectOption = async (selected) => {
    if (isFinished.value) return;

    if (selected === currentQuestion.value.answer) {
        score.value++;
        feedbackMessage.value = "¡Bien!";
        feedbackColor.value = "text-green-500";
        
        // --- 🪙 PAGO BLINDADO (v2.9.1) ---
        // Usamos await para que el "fueguito" y los retos se graben antes de seguir.
        await gamificationStore.addCoins('copper', 1);
        
        if (currentQuestionIndex.value < QUESTIONS_COUNT - 1) {
            currentQuestionIndex.value++;
            setTimeout(() => { feedbackMessage.value = ""; generateQuestion(); }, 500);
        } else {
            // Esperamos al proceso de finalización
            await finishGame();
        }
    } else {
        feedbackMessage.value = "¡Ups!";
        feedbackColor.value = "text-red-500";
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => feedbackMessage.value = "", 800);
    }
};

// ✅ CIRUGÍA: Finalización asíncrona para el bono de victoria.
const finishGame = async () => {
    isFinished.value = true;
    showCoinRain.value = true;
    
    // --- 🪙 BONO DE VICTORIA BLINDADO ---
    // El Store se encarga automáticamente de subirlo a la nube.
    await gamificationStore.addCoins('copper', 5);
    
    const totalSessionCoins = score.value + 5; 
    speak(`¡Excelente velocidad! Ganaste ${totalSessionCoins} monedas de cobre.`);
};

const resetGame = () => {
    isFinished.value = false;
    currentQuestionIndex.value = 0;
    score.value = 0;
    showCoinRain.value = false;
    generateQuestion();
};

const getThemeColor = () => {
    if (props.operation === 'add') return 'bg-green-500';
    if (props.operation === 'sub') return 'bg-orange-500';
    if (props.operation === 'mult') return 'bg-purple-500';
    return 'bg-blue-500';
};

onMounted(() => {
    generateQuestion();
    speak("¡Modo Rápido! Toca la respuesta correcta para ganar cobre.");
});
</script>

<template>
  <div class="h-[100dvh] w-full bg-slate-100 flex justify-center overflow-hidden font-sans select-none">
    
    <div v-if="showCoinRain">
        <CoinRain type="copper" :count="40" />
    </div>

    <div class="w-full max-w-xl h-full flex flex-col bg-white shadow-2xl relative">
        <div :class="`flex-none p-4 ${getThemeColor()} text-white flex justify-between items-center shadow-md z-10 transition-colors duration-300`">
            <button @click="$emit('back')" class="p-2 bg-white/20 rounded-full hover:bg-white/30 transition active:scale-95">
                <ArrowLeft class="w-6 h-6" />
            </button>
            <div class="flex flex-col items-center">
                <span class="text-xs font-bold opacity-80 uppercase tracking-widest">Tablas Rápidas</span>
                <span class="text-2xl font-black">{{ currentQuestionIndex + 1 }} / {{ QUESTIONS_COUNT }}</span>
            </div>
            <div class="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full">
                <Trophy class="w-4 h-4 text-yellow-300" />
                <span class="font-mono font-bold text-lg">{{ score }}</span>
            </div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center p-6 relative bg-slate-50">
            <div v-if="!isFinished" class="w-full flex flex-col items-center gap-8 animate-fade-in">
                
                <div class="flex items-center justify-center gap-4 text-7xl font-black text-slate-700 drop-shadow-sm py-8 animate-bounce-short select-none">
                    <span>{{ currentQuestion?.num1 }}</span>
                    <span :class="`text-6xl ${props.operation === 'add' ? 'text-green-500' : props.operation === 'sub' ? 'text-orange-500' : props.operation === 'mult' ? 'text-purple-500' : 'text-blue-500'}`">
                        {{ currentQuestion?.symbol }}
                    </span>
                    <span>{{ currentQuestion?.num2 }}</span>
                </div>

                <div class="h-8 flex items-center justify-center">
                    <span v-if="feedbackMessage" :class="`text-3xl font-black ${feedbackColor} animate-ping-once`">
                        {{ feedbackMessage }}
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-4 w-full max-w-sm">
                    <button v-for="opt in options" :key="opt" 
                        @click="selectOption(opt)"
                        class="bg-white border-b-4 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:-translate-y-1 active:translate-y-0 active:border-b-0 text-slate-700 text-5xl font-black py-6 rounded-2xl shadow-sm transition-all transform duration-100 flex justify-center items-center">
                        {{ opt }}
                    </button>
                </div>
            </div>

            <div v-else class="flex flex-col items-center gap-6 animate-fade-in text-center p-6 bg-white rounded-3xl shadow-xl w-full max-w-sm border-2 border-slate-100">
                <h2 class="text-4xl font-black text-slate-800">¡Terminaste!</h2>
                
                <div class="relative">
                    <div class="absolute inset-0 bg-orange-400 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                    <div class="bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded-full border-4 border-orange-200 shadow-inner relative z-10">
                        <Coins class="w-20 h-20 text-orange-600 drop-shadow-sm" />
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <p class="text-slate-500 font-bold uppercase tracking-wide text-sm">Recompensa Total</p>
                    <p class="text-5xl font-black text-slate-800 flex items-center justify-center gap-2">
                        {{ score + 5 }} <span class="text-xl text-orange-600 font-bold">Cobres</span>
                    </p>
                </div>
                
                <p class="text-sm text-slate-400 px-4">
                    ¡Buen trabajo! Cada moneda cuenta para tus retos diarios y para subir tu racha.
                </p>

                <div class="grid grid-cols-2 gap-3 w-full mt-4">
                    <button @click="$emit('back')" class="py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">
                        Salir
                    </button>
                    <button @click="resetGame" class="py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-500 hover:shadow-blue-500/30 transition flex items-center justify-center gap-2">
                        <RefreshCw class="w-5 h-5" /> Repetir
                    </button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-short { animation: bounceShort 0.5s; }
@keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.animate-ping-once { animation: ping .4s cubic-bezier(0, 0, 0.2, 1) 1; }
.animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>