<script setup>
import { ref, onMounted } from 'vue';
import { ArrowLeft, RefreshCw, Trophy, Coins, Sparkles } from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

const props = defineProps({
  operation: { type: String, default: 'add' }, 
  tableNumber: { type: [Number, String], default: 'random' }
});

const emit = defineEmits(['back', 'close']); 
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

// Nuevo estado para rastrear la operación actual del reto mixto
const activeOp = ref('add');

// Determina qué moneda entregar según la operación
const getCurrencyType = (op) => {
  if (op === 'add') return 'copper'; // Sumar = Cobre
  if (op === 'sub') return 'silver'; // Restar = Plata
  return 'gold'; // Multiplicar/Dividir = Oro
};

const generateQuestion = () => {
    let num1, num2, answer, symbol;
    
    // Lógica de Reto Mixto: Selecciona operación al azar (Todas las tablas)
    const ops = ['add', 'sub', 'mult', 'div'];
    activeOp.value = ops[Math.floor(Math.random() * ops.length)];
    
    const table = props.tableNumber === 'random' ? Math.floor(Math.random() * 9) + 2 : parseInt(props.tableNumber);
    
    if (activeOp.value === 'add') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 + num2; symbol = '+';
    } else if (activeOp.value === 'sub') {
        num2 = Math.floor(Math.random() * 10) + 1; answer = table; num1 = num2 + answer; symbol = '-';
    } else if (activeOp.value === 'mult') {
        num1 = table; num2 = Math.floor(Math.random() * 10) + 1; answer = num1 * num2; symbol = '×';
    } else if (activeOp.value === 'div') {
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

const selectOption = async (selected) => {
    if (isFinished.value) return;

    if (selected === currentQuestion.value.answer) {
        score.value++;
        feedbackMessage.value = "¡Bien!";
        feedbackColor.value = "text-green-500";
        
        // Asignación de moneda dinámica por operación
        await gamificationStore.addCoins(getCurrencyType(activeOp.value), 1);
        
        if (currentQuestionIndex.value < QUESTIONS_COUNT - 1) {
            currentQuestionIndex.value++;
            setTimeout(() => { feedbackMessage.value = ""; generateQuestion(); }, 500);
        } else {
            await finishGame();
        }
    } else {
        feedbackMessage.value = "¡Ups!";
        feedbackColor.value = "text-red-500";
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => feedbackMessage.value = "", 800);
    }
};

const finishGame = async () => {
    isFinished.value = true;
    showCoinRain.value = true;
    // Bono final en la moneda de la última operación resuelta
    await gamificationStore.addCoins(getCurrencyType(activeOp.value), 5);
    const totalSessionCoins = score.value + 5; 
    speak(`¡Excelente velocidad! Desafío terminado.`);
};

const resetGame = () => {
    isFinished.value = false;
    currentQuestionIndex.value = 0;
    score.value = 0;
    showCoinRain.value = false;
    generateQuestion();
};

const getThemeColor = () => {
    if (activeOp.value === 'add') return 'bg-blue-500';
    if (activeOp.value === 'sub') return 'bg-red-500';
    if (activeOp.value === 'mult') return 'bg-green-500';
    return 'bg-yellow-400';
};

const handleBack = () => {
  emit('back');
  emit('close');
};

onMounted(() => {
    generateQuestion();
    speak("¡Iniciando Reto Mixto!");
});
</script>

<template>
  <div class="h-[100dvh] w-full bg-white flex justify-center overflow-hidden font-sans select-none text-slate-900">
    <div class="w-full max-w-[500px] h-full flex flex-col bg-slate-50 relative shadow-2xl border-x border-slate-100 overflow-hidden mx-auto animate-fade-in">
    
        <div v-if="showCoinRain" class="z-[400]">
            <CoinRain :type="getCurrencyType(activeOp)" :count="40" />
        </div>

        <header :class="`flex-none p-4 ${getThemeColor()} text-white flex justify-between items-center shadow-md z-10 transition-colors duration-300 text-center`">
            <button @click="handleBack" 
                    class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 transition-all font-black text-xs border-2 border-green-700 uppercase tracking-widest">
                <ArrowLeft size="18" stroke-width="3" /> REGRESAR
            </button>
            <div class="flex flex-col items-center">
                <span class="text-[10px] font-bold opacity-80 uppercase tracking-widest">Reto Mixto</span>
                <span class="text-xl font-black">{{ currentQuestionIndex + 1 }} / {{ QUESTIONS_COUNT }}</span>
            </div>
            <div class="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/20">
                <Trophy class="w-4 h-4 text-yellow-300" />
                <span class="font-mono font-bold text-lg">{{ score }}</span>
            </div>
        </header>

        <main class="flex-1 flex flex-col items-center justify-start p-6 relative bg-white pt-6">
            
            <div v-if="!isFinished" class="w-full flex flex-col items-center gap-2 animate-fade-in">
                
                <div class="flex items-center justify-center gap-4 text-5xl font-black text-slate-700 drop-shadow-sm py-2 animate-bounce-short">
                    <span>{{ currentQuestion?.num1 }}</span>
                    <span :class="`${activeOp === 'add' ? 'text-blue-500' : activeOp === 'sub' ? 'text-red-500' : activeOp === 'mult' ? 'text-green-500' : 'text-yellow-500'}`">
                        {{ currentQuestion?.symbol }}
                    </span>
                    <span>{{ currentQuestion?.num2 }}</span>
                </div>

                <div class="h-8 flex items-center justify-center">
                    <span v-if="feedbackMessage" :class="`text-xl font-black ${feedbackColor} animate-ping-once uppercase italic`">
                        {{ feedbackMessage }}
                    </span>
                </div>

                <div class="grid grid-cols-1 gap-2.5 w-full max-w-[300px]">
                    <button v-for="opt in options" :key="opt" @click="selectOption(opt)"
                        class="bg-white border-b-4 border-slate-200 hover:border-blue-400 active:translate-y-1 active:border-b-0 text-slate-700 text-4xl font-black py-4 rounded-2xl shadow-md transition-all flex justify-center items-center">
                        {{ opt }}
                    </button>
                </div>

                <div class="mt-6 text-center px-4 w-full">
                    <div class="flex items-center justify-center gap-1.5 mb-1">
                        <Sparkles size="14" class="text-indigo-500" />
                        <span class="text-[11px] font-black text-indigo-800 uppercase tracking-widest">REGLAS DEL DESAFÍO</span>
                    </div>
                    <p class="text-[11px] font-bold text-slate-600 leading-tight uppercase">
                        Suma = <span class="text-orange-600">Cobre</span> | Resta = <span class="text-slate-500">Plata</span> | Mult/Div = <span class="text-amber-500">Oro</span>
                    </p>
                </div>
            </div>

            <div v-else class="flex flex-col items-center gap-6 animate-fade-in text-center p-8 bg-white rounded-[3rem] shadow-2xl w-[90%] border-4 border-orange-100 my-auto">
                <h2 class="text-4xl font-black text-slate-800 uppercase tracking-tighter italic">¡Felicidades!</h2>
                <div class="bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded-full border-4 border-orange-200 shadow-inner">
                    <Coins class="w-16 h-16 text-orange-600" />
                </div>
                <p class="text-5xl font-black text-slate-800 italic uppercase">{{ score + 5 }} Cobres</p>
                <div class="flex flex-col gap-3 w-full mt-4">
                    <button @click="resetGame" class="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg active:translate-y-1 transition-all uppercase text-sm tracking-widest">OTRA CARRERA</button>
                    <button @click="handleBack" class="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 uppercase text-xs">SALIR</button>
                </div>
            </div>
        </main>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce-short { animation: bounceShort 0.6s ease-in-out infinite alternate; }
@keyframes bounceShort { from { transform: translateY(0); } to { transform: translateY(-8px); } }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>