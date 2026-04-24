<script setup>
/** * ARCHIVO: DecimalSub.vue
 * ESTADO: VERSIÓN PRODUCCIÓN (V26) - SONIDO WRONG1 Y TIEMPO DE LECTURA AMPLIADO
 * LÓGICA: Ajuste de mensaje de préstamo, grosor de línea roja, y delay de transición.
 */
import { ref, computed, onMounted } from 'vue';
import { X as CloseIcon, Check, ArrowLeft, AlertTriangle } from 'lucide-vue-next';
import DecimalKeypad from './DecimalKeypad.vue';

const emit = defineEmits(['close']);

const exercises = ref([]);
const currentExIdx = ref(0);
const isTransitioning = ref(false);
const isFinished = ref(false); 
const errorCol = ref(null); 

const sequence = [9, 8, 6, 5, 4, 3, 2]; // Orden: derecha a izquierda

const tasks = ref([]);
const currentTaskIdx = ref(0);
const currentInputStr = ref('');
const userInputs = ref({}); 
const crossedOut = ref({}); 

const currentTask = computed(() => tasks.value[currentTaskIdx.value]);
const currentMsg = computed(() => currentTask.value?.msg || 'Alinea las comas y resta columna por columna.');

const confettiPieces = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
    transform: `rotate(${Math.random() * 360}deg)`
}));

const getDigit = (num, col) => {
    if (num === undefined || num === null) return '';
    const str = num.toFixed(2); 
    const [intP, decP] = str.split('.');
    
    if (col === 9) return decP[1] || '0'; 
    if (col === 8) return decP[0] || '0'; 
    if (col === 6) return intP[intP.length - 1] || ''; 
    if (col === 5) return intP[intP.length - 2] || ''; 
    if (col === 4) return intP[intP.length - 3] || ''; 
    if (col === 3) return intP[intP.length - 4] || ''; 
    if (col === 2) return intP[intP.length - 5] || ''; 
    return '';
};

// --- CEREBRO V25: CONSTRUCTOR DE TAREAS (LÉXICO DIRECTO Y CONCISO) ---
const buildTasksForExercise = (ex) => {
    let newTasks = [];
    let topValues = {};
    let botValues = {};
    
    sequence.forEach(col => {
        topValues[col] = parseInt(getDigit(ex.top, col)) || 0;
        botValues[col] = parseInt(getDigit(ex.bot, col)) || 0;
    });

    for (let i = 0; i < sequence.length; i++) {
        let col = sequence[i];
        let tVal = topValues[col];
        let bVal = botValues[col];
        
        let remainingTop = false;
        for(let j = i; j < sequence.length; j++) {
            if (getDigit(ex.top, sequence[j]) !== '' || getDigit(ex.bot, sequence[j]) !== '') remainingTop = true;
        }
        if (!remainingTop && tVal === 0) break;

        if (tVal < bVal) {
            // ADVERTENCIA MANUAL
            newTasks.push({
                id: `warn-${col}`, col: col, type: 'warn', expected: 'CLICK',
                msg: `A ${tVal} no le puedes quitar ${bVal}. ¡Toca la casilla ROJA y pide prestado a la izquierda!`
            });

            // FILA 1 (BAJA): EL QUE PRESTA
            let neighborIdx = i + 1;
            let colsToBorrowFrom = [];
            
            while (topValues[sequence[neighborIdx]] === 0 && neighborIdx < sequence.length -1) {
                colsToBorrowFrom.push(sequence[neighborIdx]);
                neighborIdx++;
            }
            colsToBorrowFrom.push(sequence[neighborIdx]); 
            
            for (let j = colsToBorrowFrom.length - 1; j >= 0; j--) {
                let currentBorrowCol = colsToBorrowFrom[j];
                let currentBorrowVal = topValues[currentBorrowCol];
                let newVal = currentBorrowVal === 0 ? 9 : currentBorrowVal - 1;
                
                topValues[currentBorrowCol] = newVal;
                
                // LÉXICO CORREGIDO: Sin "vecinos" ni "decenas"
                let msg = currentBorrowVal === 0
                    ? `Recibes 1 de la izquierda, pero prestas a la derecha. Eres 0, quedas en 9. Escríbelo.`
                    : `Presta 1. Eres ${currentBorrowVal}, resta y quedas en ${newVal}. Escríbelo.`;

                newTasks.push({
                    id: `top1-${currentBorrowCol}`, col: currentBorrowCol, type: 'borrow', expected: newVal.toString(), msg: msg
                });
            }

            // FILA 2 (ALTA): EL QUE RECIBE
            let myNewVal = tVal + 10;
            topValues[col] = myNewVal; 
            
            newTasks.push({
                id: `top2-${col}`, col: col, type: 'receive', expected: myNewVal.toString(),
                msg: `Recibes 1 de la izquierda que equivale a 10. Suma: ${tVal} + 10 = ${myNewVal}. Escríbelo.`
            });

            // RESULTADO DESPUÉS DE PRESTAR
             newTasks.push({
                id: `res-${col}`, col: col, type: 'res', expected: (myNewVal - bVal).toString(),
                msg: `¡Ahora sí! Resta: ${myNewVal} - ${bVal} = ${myNewVal - bVal}. Escríbelo.`
            });

        } else {
            // RESTA DIRECTA
            if (getDigit(ex.top, col) !== '' || getDigit(ex.bot, col) !== '') {
                 newTasks.push({
                    id: `res-${col}`, col: col, type: 'res', expected: (tVal - bVal).toString(),
                    msg: `Resta la columna: ${tVal} - ${bVal} = ${tVal - bVal}. Escríbelo.`
                });
            }
        }
    }
    return newTasks;
};

const generateBatch = () => {
    let batch = [];
    for(let i = 0; i < 5; i++) {
        let num1 = parseFloat((Math.random() * 9000 + 1000).toFixed(2));
        let num2 = parseFloat((Math.random() * 9000 + 1000).toFixed(2));
        batch.push({ top: Math.max(num1, num2), bot: Math.min(num1, num2), completed: false });
    }
    exercises.value = batch;
    currentExIdx.value = 0;
    isFinished.value = false;
    setupExercise();
};

const currentEx = computed(() => exercises.value[currentExIdx.value] || { top: 0, bot: 0 });

const setupExercise = () => {
    userInputs.value = {};
    crossedOut.value = {}; 
    isTransitioning.value = false;
    errorCol.value = null;
    currentInputStr.value = '';
    
    tasks.value = buildTasksForExercise(currentEx.value);
    currentTaskIdx.value = 0;
};

const handleWarnClick = (col) => {
    if (currentTask.value?.type === 'warn' && currentTask.value?.col === col && !isTransitioning.value) {
        currentTaskIdx.value++;
        errorCol.value = null;
        if (navigator.vibrate) navigator.vibrate(50);
    }
};

const handleKeypress = (key) => {
    if (isTransitioning.value || isFinished.value || key === ',' || key === 'del' || !currentTask.value) return;
    
    if (currentTask.value.type === 'warn') {
        errorCol.value = currentTask.value.col;
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => { errorCol.value = null; }, 500);
        return;
    }

    const expected = currentTask.value.expected;
    const proposedStr = currentInputStr.value + key.toString();

    if (expected.startsWith(proposedStr)) {
        currentInputStr.value = proposedStr;
        
        if (proposedStr === expected) {
            userInputs.value[currentTask.value.id] = expected; 
            errorCol.value = null; 
            
            if (currentTask.value.id.startsWith('top1-') || currentTask.value.id.startsWith('top2-')) {
                crossedOut.value[currentTask.value.col] = true;
            }

            currentTaskIdx.value++;
            currentInputStr.value = ''; 
            
            if (currentTaskIdx.value >= tasks.value.length) {
                completeExercise();
            }
        }
    } else {
        errorCol.value = currentTask.value.col;
        currentInputStr.value = ''; 
        if (navigator.vibrate) navigator.vibrate(200);
        setTimeout(() => { errorCol.value = null; }, 500);
    }
};

const completeExercise = () => {
    isTransitioning.value = true;
    exercises.value[currentExIdx.value].completed = true;
    errorCol.value = null;
    
    // 🟢 SONIDO 'WRONG1' AL COMPLETAR EL EJERCICIO INDIVIDUAL
    try {
        const transAudio = new Audio('/audios/wrong1.mp3');
        transAudio.play();
    } catch(e) {
        console.error("Error reproduciendo audio de transición:", e);
    }
    
    // 🟢 TIEMPO AMPLIADO A 2.5 SEGUNDOS (2500ms) PARA PERMITIR LECTURA
    setTimeout(() => {
        if (currentExIdx.value < exercises.value.length - 1) {
            currentExIdx.value++;
            setupExercise();
        } else {
            isFinished.value = true;
            isTransitioning.value = false;
            try { new Audio('/audios/finish.mp3').play(); } catch(e){}
        }
    }, 2500); 
};

const handleDelete = () => {};

onMounted(() => {
    generateBatch();
});
</script>

<template>
  <div class="absolute inset-0 z-[300] bg-slate-900/85 backdrop-blur-sm flex justify-center items-center animate-fade-in">
    
    <div class="bg-white w-full max-w-[560px] h-full flex flex-col relative shadow-2xl border-x-0 sm:border-x-[6px] border-orange-400 overflow-hidden">
      
      <div class="absolute top-4 right-4 z-50">
          <button @click="emit('close')" class="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95" title="Salir al Lobby">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
      </div>

      <div class="pl-3 pr-14 pt-5 pb-1 flex items-start gap-2 sm:gap-3 shrink-0">
        <div class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 relative z-10">
          <div class="w-full h-full bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200 text-2xl shadow-sm">🦉</div>
          <div class="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black px-1.5 rounded-full border-2 border-white z-20">{{ currentExIdx + 1 }}/5</div>
        </div>
        <div class="border-2 rounded-2xl rounded-tl-none p-3 shadow-sm relative flex-1 mt-1 transition-all h-auto min-h-[3.5rem]" 
             :class="isTransitioning ? 'bg-green-100 border-green-300' : (currentTask?.type === 'warn' ? 'bg-red-50 border-red-300' : 'bg-yellow-100 border-yellow-300')">
            <p class="font-bold text-xs sm:text-sm leading-snug" :class="currentTask?.type === 'warn' ? 'text-red-800' : 'text-yellow-900'">
              <span v-if="isFinished" class="font-black text-indigo-700">¡Eres increíble! Has completado todas las restas.</span>
              <span v-else-if="isTransitioning" class="font-black text-green-700">¡Perfecto! Preparando la siguiente...</span>
              <span v-else v-html="currentMsg"></span>
            </p>
        </div>
      </div>

      <div v-if="isFinished" class="absolute inset-0 top-[100px] z-[250] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-6 text-center">
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div v-for="c in confettiPieces" :key="c.id" class="confetti-piece"
                   :style="{ left: c.left, animationDelay: c.animationDelay, backgroundColor: c.backgroundColor, transform: c.transform }">
              </div>
          </div>
          
          <div class="w-32 h-32 bg-green-100 rounded-full border-4 border-green-400 flex items-center justify-center mb-6 shadow-xl z-10 animate-bounce">
              <Check class="w-16 h-16 text-green-600" stroke-width="4" />
          </div>
          <h2 class="text-3xl sm:text-4xl font-black text-indigo-800 mb-2 z-10 uppercase tracking-tight">¡Misión Cumplida!</h2>
          <p class="text-slate-500 font-bold mb-10 z-10">Tanda de restas completada con éxito</p>
          
          <div class="w-full max-w-sm flex flex-col gap-3 z-10">
              <button @click="generateBatch" class="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-2xl font-black text-lg py-4 shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-1 transition-all flex items-center justify-center gap-3 uppercase">
                  JUGAR OTRA VEZ
              </button>
              
              <button @click="emit('close')" class="w-full bg-white text-slate-500 border-2 border-slate-200 rounded-2xl font-black text-sm py-4 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase hover:bg-slate-50 hover:text-slate-700">
                  <ArrowLeft :size="18" stroke-width="3" /> VOLVER AL LOBBY
              </button>
          </div>
      </div>

      <div class="flex-1 w-full bg-[#f8fafc] flex flex-col items-center justify-start pt-2 pb-2 sm:pb-4 px-2 sm:px-4 relative min-h-0">
        
        <div class="w-full bg-white border-4 rounded-3xl shadow-md py-3 px-2 sm:py-5 sm:px-4 relative mt-3 sm:mt-5 mb-auto transition-colors duration-500"
             :class="isTransitioning ? 'border-green-400 bg-green-50/30' : 'border-slate-200'"
             style="background-image: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 2rem 2rem;">
            
            <div v-if="isTransitioning" class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <Check class="w-32 h-32 sm:w-48 sm:h-48 text-green-500/30 drop-shadow-sm" stroke-width="5" />
            </div>

            <div class="relative z-10 w-full grid grid-cols-[15px_repeat(5,1fr)_12px_repeat(2,1fr)] sm:grid-cols-[20px_repeat(5,1fr)_20px_repeat(2,1fr)] gap-x-1 sm:gap-x-2 text-slate-800 font-mono font-black text-[28px] sm:text-[36px] text-center">
                
                <div class="col-start-7 row-span-full w-full h-[105%] border-r-2 border-dashed border-teal-200/50 z-0"></div>

                <div class="col-start-1 h-7 sm:h-9"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'top2-'+col">
                    <div v-if="col === 7" class="col-start-7"></div>
                    <div v-else :class="`col-start-${col} h-7 sm:h-9 flex items-end justify-center z-20 pb-0.5`">
                        <div v-if="userInputs['top2-'+col] !== undefined" class="w-8 h-6 sm:w-10 sm:h-8 border-2 border-orange-300 text-orange-600 rounded-md flex items-center justify-center text-sm sm:text-base font-black bg-orange-50 shadow-inner animate-fade-in">
                            {{ userInputs['top2-'+col] }}
                        </div>
                        <div v-else-if="currentTask && currentTask.id === 'top2-'+col && !isTransitioning" 
                             :class="['w-8 h-6 sm:w-10 sm:h-8 rounded-md flex items-center justify-center text-sm sm:text-base font-black transition-all shadow-md', errorCol === col ? 'bg-red-50 border-2 border-red-500 text-red-600 animate-shake' : 'bg-yellow-100 border-2 border-yellow-400 ring-2 ring-yellow-200 scale-110 text-yellow-800']">
                            {{ currentInputStr }}
                        </div>
                    </div>
                </template>

                <div class="col-start-1 h-7 sm:h-9"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'top1-'+col">
                    <div v-if="col === 7" class="col-start-7"></div>
                    <div v-else :class="`col-start-${col} h-7 sm:h-9 flex items-end justify-center z-20 pb-0.5`">
                        <div v-if="userInputs['top1-'+col] !== undefined" class="w-8 h-6 sm:w-10 sm:h-8 border-2 border-orange-300 text-orange-600 rounded-md flex items-center justify-center text-sm sm:text-base font-black bg-orange-50 shadow-inner animate-fade-in">
                            {{ userInputs['top1-'+col] }}
                        </div>
                        <div v-else-if="currentTask && currentTask.id === 'top1-'+col && !isTransitioning" 
                             :class="['w-8 h-6 sm:w-10 sm:h-8 rounded-md flex items-center justify-center text-sm sm:text-base font-black transition-all shadow-md', errorCol === col ? 'bg-red-50 border-2 border-red-500 text-red-600 animate-shake' : 'bg-yellow-100 border-2 border-yellow-400 ring-2 ring-yellow-200 scale-110 text-yellow-800']">
                            {{ currentInputStr }}
                        </div>
                    </div>
                </template>

                <div class="col-start-1 h-10 sm:h-12"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'top-'+col">
                    <div v-if="col === 7" class="col-start-7 flex items-end justify-center text-3xl sm:text-4xl text-teal-600 z-10 leading-none -translate-y-1 sm:-translate-y-2">,</div>
                    <div v-else :class="['col-start-'+col, 'flex items-center justify-center z-10 leading-none transition-all relative', crossedOut[col] ? 'text-slate-300 scale-90' : 'text-slate-800']">
                        {{ getDigit(currentEx.top, col) }}
                        <div v-if="crossedOut[col]" class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div class="w-6 sm:w-8 h-[3px] bg-red-500 transform -rotate-45 scale-110 animate-fade-in rounded-sm drop-shadow-sm"></div>
                        </div>
                    </div>
                </template>

                <div class="col-start-1 flex items-center justify-center text-orange-500 z-10 leading-none mt-2">-</div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'bot-'+col">
                    <div v-if="col === 7" class="col-start-7 flex items-end justify-center text-3xl sm:text-4xl text-teal-600 z-10 mt-2 leading-none -translate-y-1 sm:-translate-y-2">,</div>
                    <div v-else :class="`col-start-${col} flex items-center justify-center z-10 leading-none mt-2`">
                        {{ getDigit(currentEx.bot, col) }}
                    </div>
                </template>

                <div class="col-start-2 col-end-10 h-[5px] bg-slate-800 rounded-full my-3 sm:my-4 z-10"></div>

                <div class="col-start-1 h-10 sm:h-14"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'res-'+col">
                    <div v-if="col === 7" class="col-start-7 h-10 sm:h-14 flex items-end justify-center text-3xl sm:text-4xl text-teal-600 z-10 leading-none -translate-y-0.5 sm:-translate-y-1" :class="isTransitioning ? '' : 'animate-pulse'">,</div>
                    
                    <div v-else :class="`col-start-${col} z-10 h-10 sm:h-14`">
                        <div v-if="userInputs['res-'+col] !== undefined" class="w-full h-full bg-green-100 border-2 border-green-500 text-green-700 rounded-xl flex items-center justify-center shadow-inner animate-fade-in leading-none pt-1">
                            {{ userInputs['res-'+col] }}
                        </div>
                        
                        <div v-else-if="currentTask && currentTask.type === 'warn' && currentTask.col === col && !isTransitioning" 
                             @click="handleWarnClick(col)"
                             :class="['w-full h-full bg-red-100 border-2 border-red-500 text-red-600 rounded-xl flex items-center justify-center cursor-pointer animate-pulse shadow-md hover:bg-red-200 transition-colors', errorCol === col ? 'animate-shake' : '']">
                             <AlertTriangle :size="24" stroke-width="2.5" />
                        </div>

                        <div v-else-if="currentTask && currentTask.id === 'res-'+col && !isTransitioning" 
                             :class="[
                                'w-full h-full flex items-center justify-center transition-all shadow-md',
                                errorCol === col 
                                    ? 'bg-red-50 border-2 border-red-500 rounded-full text-red-600 animate-shake scale-100' 
                                    : 'bg-yellow-50 border-yellow-400 ring-2 sm:ring-4 ring-yellow-200 rounded-xl scale-110'
                             ]">
                        </div>

                        <div v-else-if="col >= 6 || getDigit(currentEx.top, col) !== '' || getDigit(currentEx.bot, col) !== ''" class="w-full h-full border-2 border-slate-200/50 rounded-xl flex items-center justify-center"></div>
                    </div>
                </template>

            </div>
        </div>
      </div>

      <div class="shrink-0 w-full z-20 pb-8 sm:pb-6 bg-white border-t-2 border-slate-100" :class="isTransitioning || isFinished ? 'opacity-50 pointer-events-none' : ''">
          <DecimalKeypad @press="handleKeypress" @delete="handleDelete" />
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { 
  from { opacity: 0; transform: scale(0.98); } 
  to { opacity: 1; transform: scale(1); } 
}

.animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.confetti-piece {
    position: absolute;
    top: -20px;
    width: 10px;
    height: 10px;
    opacity: 0.8;
    border-radius: 2px;
    animation: fall 3s ease-in forwards;
}

@keyframes fall {
    0% { top: -20px; opacity: 1; }
    100% { top: 100vh; opacity: 0; }
}
</style>