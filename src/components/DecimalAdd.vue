<script setup>
/** * ARCHIVO: DecimalNotebook.vue
 * ESTADO: MÓDULO EXCLUSIVO DE SUMAS (V18) - ENCUADRE PC BLINDADO
 * LÓGICA: Contenedor para los ejercicios de SUMA (+). Maneja "carries" (llevadas).
 * IMPORTANTE: ¡No mezclar con la lógica de restas (DecimalSub.vue)!
 */
import { ref, computed, onMounted } from 'vue';
import { X as CloseIcon, Check, ArrowLeft } from 'lucide-vue-next';
import DecimalKeypad from './DecimalKeypad.vue';

const emit = defineEmits(['close']);

const exercises = ref([]);
const currentExIdx = ref(0);
const isTransitioning = ref(false);
const isFinished = ref(false); 
const errorCol = ref(null); 

const sequence = [9, 8, 6, 5, 4, 3, 2]; 
const activeSeqIdx = ref(0);

const currentCol = computed(() => sequence[activeSeqIdx.value]);
const userInputs = ref({}); 
const carries = ref({});    

const confettiPieces = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
    transform: `rotate(${Math.random() * 360}deg)`
}));

const generateBatch = () => {
    let batch = [];
    for(let i = 0; i < 5; i++) {
        let top = (Math.random() * 9000 + 1000).toFixed(2);
        let bot = (Math.random() * 9000 + 1000).toFixed(2);
        batch.push({ top: parseFloat(top), bot: parseFloat(bot), completed: false });
    }
    exercises.value = batch;
    currentExIdx.value = 0;
    isFinished.value = false;
    setupExercise();
};

const currentEx = computed(() => exercises.value[currentExIdx.value] || { top: 0, bot: 0 });

const playFinishSound = () => {
    try {
        const audio = new Audio('/audios/finish.mp3');
        audio.play();
    } catch(e) {
        console.error("Error reproduciendo audio:", e);
    }
};

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

const setupExercise = () => {
    userInputs.value = {};
    carries.value = {};
    activeSeqIdx.value = 0;
    isTransitioning.value = false;
    errorCol.value = null;
};

const handleKeypress = (key) => {
    if (isTransitioning.value || isFinished.value || key === ',' || key === 'del') return;

    const cCol = currentCol.value;
    
    const tDig = parseInt(getDigit(currentEx.value.top, cCol) || '0');
    const bDig = parseInt(getDigit(currentEx.value.bot, cCol) || '0');
    const carryIn = carries.value[cCol] || 0;

    const sum = tDig + bDig + carryIn;
    const expectedDigit = sum % 10;
    const carryOut = Math.floor(sum / 10);

    if (parseInt(key) === expectedDigit) {
        userInputs.value[cCol] = key; 
        errorCol.value = null; 
        
        activeSeqIdx.value++;
        
        if (activeSeqIdx.value < sequence.length) {
            const nextCol = sequence[activeSeqIdx.value];
            
            if (carryOut > 0) carries.value[nextCol] = carryOut;

            let hasMore = false;
            for(let i = activeSeqIdx.value; i < sequence.length; i++) {
                const checkCol = sequence[i];
                if (getDigit(currentEx.value.top, checkCol) !== '' || 
                    getDigit(currentEx.value.bot, checkCol) !== '' || 
                    carries.value[checkCol] > 0) {
                    hasMore = true;
                    break;
                }
            }

            if (!hasMore) completeExercise();
        } else {
            completeExercise();
        }
    } else {
        errorCol.value = cCol;
        if (navigator.vibrate) navigator.vibrate(200);
        
        setTimeout(() => {
            if (errorCol.value === cCol) errorCol.value = null;
        }, 500);
    }
};

const completeExercise = () => {
    isTransitioning.value = true;
    exercises.value[currentExIdx.value].completed = true;
    errorCol.value = null;
    
    setTimeout(() => {
        if (currentExIdx.value < exercises.value.length - 1) {
            currentExIdx.value++;
            setupExercise();
        } else {
            isFinished.value = true;
            isTransitioning.value = false;
            playFinishSound();
        }
    }, 1200);
};

const handleDelete = () => {};

onMounted(() => {
    generateBatch();
});
</script>

<template>
  <div class="absolute inset-0 z-[300] bg-slate-900/85 backdrop-blur-sm flex justify-center items-center animate-fade-in">
    
    <div class="bg-white w-full max-w-[560px] h-full flex flex-col relative shadow-2xl border-x-0 sm:border-x-[6px] border-teal-400 overflow-hidden">
      
      <div class="absolute top-4 right-4 z-50">
          <button @click="emit('close')" class="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95" title="Salir al Lobby">
            <CloseIcon :size="24" stroke-width="2.5" />
          </button>
      </div>

      <div class="pl-3 pr-14 pt-5 pb-1 flex items-start gap-2 sm:gap-3 shrink-0">
        <div class="w-14 h-14 sm:w-16 sm:h-16 shrink-0 relative z-10">
          <div class="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center border-2 border-indigo-200 text-2xl shadow-sm">🦉</div>
          <div class="absolute -top-1 -right-1 bg-teal-500 text-white text-[10px] font-black px-1.5 rounded-full border-2 border-white z-20">{{ currentExIdx + 1 }}/5</div>
        </div>
        <div class="bg-yellow-100 border-2 border-yellow-300 rounded-2xl rounded-tl-none p-3 shadow-sm relative flex-1 mt-1 transition-all h-auto min-h-[3.5rem]" :class="isTransitioning ? 'bg-green-100 border-green-300' : ''">
            <p class="text-yellow-900 font-bold text-xs sm:text-sm leading-snug">
              <span v-if="isFinished" class="font-black text-indigo-700">¡Eres increíble! Has completado todos los ejercicios.</span>
              <span v-else-if="isTransitioning" class="font-black text-green-700">¡Perfecto! Preparando el siguiente...</span>
              <span v-else>Alinea las comas y suma columna por columna. <span class="font-black">¡Vamos, tú puedes!</span></span>
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
          <p class="text-slate-500 font-bold mb-10 z-10">Tanda decimal completada con éxito</p>
          
          <div class="w-full max-w-sm flex flex-col gap-3 z-10">
              <button @click="generateBatch" class="w-full bg-gradient-to-r from-teal-400 to-emerald-500 text-white rounded-2xl font-black text-lg py-4 shadow-[0_6px_0_rgb(4,120,87)] active:translate-y-1 transition-all flex items-center justify-center gap-3 uppercase">
                  JUGAR OTRA VEZ
              </button>
              
              <button @click="emit('close')" class="w-full bg-white text-slate-500 border-2 border-slate-200 rounded-2xl font-black text-sm py-4 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase hover:bg-slate-50 hover:text-slate-700">
                  <ArrowLeft :size="18" stroke-width="3" /> VOLVER AL LOBBY
              </button>
          </div>
      </div>

      <div class="flex-1 w-full bg-[#f8fafc] flex flex-col items-center justify-start pt-2 pb-2 sm:pb-4 px-2 sm:px-4 relative min-h-0">
        
        <div class="w-full bg-white border-4 rounded-3xl shadow-md py-6 px-2 sm:py-8 sm:px-4 relative mt-6 sm:mt-8 mb-auto transition-colors duration-500"
             :class="isTransitioning ? 'border-green-400 bg-green-50/30' : 'border-slate-200'"
             style="background-image: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 2rem 2rem;">
            
            <div v-if="isTransitioning" class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <Check class="w-32 h-32 sm:w-48 sm:h-48 text-green-500/30 drop-shadow-sm" stroke-width="5" />
            </div>

            <div class="relative z-10 w-full grid grid-cols-[15px_repeat(5,1fr)_12px_repeat(2,1fr)] sm:grid-cols-[20px_repeat(5,1fr)_20px_repeat(2,1fr)] gap-x-1 sm:gap-x-2 text-slate-800 font-mono font-black text-[28px] sm:text-[36px] text-center">
                
                <div class="col-start-7 row-span-full w-full h-[105%] border-r-2 border-dashed border-teal-200/50 z-0"></div>

                <div class="col-start-1 h-6 sm:h-8"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'carry-'+col">
                    <div v-if="col === 7" class="col-start-7"></div>
                    <div v-else :class="`col-start-${col} flex items-end justify-center text-sm sm:text-base text-orange-500 z-10 h-6 mb-1 animate-fade-in`">
                        {{ carries[col] || '' }}
                    </div>
                </template>

                <div class="col-start-1 h-10 sm:h-12"></div>
                <template v-for="col in [2,3,4,5,6,7,8,9]" :key="'top-'+col">
                    <div v-if="col === 7" class="col-start-7 flex items-end justify-center text-3xl sm:text-4xl text-teal-600 z-10 leading-none -translate-y-1 sm:-translate-y-2">,</div>
                    <div v-else :class="`col-start-${col} flex items-center justify-center z-10 leading-none`">
                        {{ getDigit(currentEx.top, col) }}
                    </div>
                </template>

                <div class="col-start-1 flex items-center justify-center text-teal-500 z-10 leading-none mt-2">+</div>
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
                        <div v-if="userInputs[col] !== undefined" class="w-full h-full bg-green-100 border-2 border-green-500 text-green-700 rounded-xl flex items-center justify-center shadow-inner animate-fade-in leading-none pt-1">
                            {{ userInputs[col] }}
                        </div>
                        
                        <div v-else-if="currentCol === col && !isTransitioning" 
                             :class="[
                                'w-full h-full flex items-center justify-center transition-all shadow-md',
                                errorCol === col 
                                    ? 'bg-red-50 border-2 border-red-500 rounded-full text-red-600 animate-shake scale-100' 
                                    : 'bg-yellow-50 border-yellow-400 ring-2 sm:ring-4 ring-yellow-200 rounded-xl scale-110'
                             ]">
                        </div>

                        <div v-else-if="col >= 6 || getDigit(currentEx.top, col) !== '' || getDigit(currentEx.bot, col) !== '' || carries[col]" class="w-full h-full border-2 border-slate-200/50 rounded-xl flex items-center justify-center"></div>
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