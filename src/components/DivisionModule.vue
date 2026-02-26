<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { 
  ArrowLeft, RefreshCw, Trophy, Eraser, Sparkles, Divide, X as CloseIcon, HelpCircle, Check 
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import OwlImage from './OwlImage.vue';
import VirtualKeypad from './VirtualKeypad.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// --- INTEGRACIÓN FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, setDoc, increment } from "firebase/firestore";

const emit = defineEmits(['back']);
const gamificationStore = useGamificationStore(); 

// --- ESTADO ---
const dividend = ref(0);
const divisor = ref(0);
const userInputs = ref({});
const solutionSteps = ref([]);
const difficulty = ref(1); 
const forcedDivisor = ref('random');
const selectedIndices = ref([]);
const isSelectionComplete = ref(false); 
const showCoinRain = ref(false); 
const isSuccess = ref(false);
const showTableModal = ref(false); 

const activeExerciseIndex = ref(0);
const MAX_EXERCISES = 5;
const isTransitioning = ref(false);

const scrollContainer = ref(null);
const inputsRef = ref({});
const uid = Math.random().toString(36).substring(7);

const setRef = (key, el) => { if(el) inputsRef.value[key] = el; };

const THEMES = [
  { name: 'yellow', border: 'border-yellow-400', bg: 'bg-yellow-50', ring: 'ring-yellow-400', text: 'text-yellow-900', icon: 'text-yellow-600' },
  { name: 'violet', border: 'border-violet-400', bg: 'bg-violet-50', ring: 'ring-violet-400', text: 'text-violet-900', icon: 'text-violet-600' },
  { name: 'blue', border: 'border-blue-400', bg: 'bg-blue-50', ring: 'ring-blue-400', text: 'text-blue-900', icon: 'text-blue-600' },
  { name: 'green', border: 'border-green-400', bg: 'bg-green-50', ring: 'ring-green-400', text: 'text-green-900', icon: 'text-green-600' }, 
];

const currentHint = ref({
  message: '',
  activeKeys: [],
  theme: THEMES[0]
});

const saveProgressToCloud = async (oroGanado) => {
  const user = auth.currentUser;
  if (!user) return; 

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      stats: { 
        gold: increment(oroGanado),
        lastActivity: Date.now()
      }
    }, { merge: true });
  } catch (error) {
    console.error("Error guardando oro en nube:", error);
  }
};

const multiplicationTable = computed(() => {
    const d = divisor.value;
    const list = [];
    for(let i=1; i<=10; i++) {
        list.push({ n1: d, n2: i, res: d*i });
    }
    return list;
});

const solveDivision = (div, dvr) => {
  const divStr = div.toString();
  const steps = [];
  let currentPart = 0;
  let gridRow = 1; 
  
  let take = 1;
  let initialPart = parseInt(divStr.substring(0, take));
  while (initialPart < dvr && take < divStr.length) {
      take++;
      initialPart = parseInt(divStr.substring(0, take));
  }
  
  currentPart = initialPart;
  let processedIndex = take - 1; 
  
  while (processedIndex < divStr.length) {
      const quotientDigit = Math.floor(currentPart / dvr);
      const product = quotientDigit * dvr;
      const subResult = currentPart - product;
      
      const currentMinuend = currentPart; 
      const currentSubtrahend = product;

      steps.push({ type: 'quotient', value: quotientDigit, index: processedIndex, hintPart: currentPart });
      steps.push({ type: 'product', value: product, row: gridRow, colEnd: processedIndex, hintPart: currentPart, quotientDigit: quotientDigit });
      
      gridRow++; 

      if (processedIndex + 1 < divStr.length) {
          const nextDigit = divStr[processedIndex + 1];
          const nextFullNumberStr = subResult.toString() + nextDigit;
          const nextFullNumber = parseInt(nextFullNumberStr);
          
          steps.push({ 
              type: 'remainder', 
              value: nextFullNumberStr, 
              row: gridRow, 
              colEnd: processedIndex + 1, 
              subResult: subResult, 
              nextDigit: nextDigit,
              dividendIndexToDrop: processedIndex + 1,
              minuend: currentMinuend,
              subtrahend: currentSubtrahend
          });
          
          currentPart = nextFullNumber;
          processedIndex++;
          gridRow++;
      } else {
          steps.push({ 
              type: 'finalRemainder', 
              value: subResult, 
              row: gridRow, 
              colEnd: processedIndex,
              minuend: currentMinuend,
              subtrahend: currentSubtrahend
          });
          break;
      }
  }
  return steps;
};

const orderedKeys = computed(() => {
    const keys = [];
    if (!solutionSteps.value.length) return keys;

    solutionSteps.value.forEach(step => {
        if (step.type === 'quotient') {
            keys.push(`q-${step.index}`);
        } else {
            const valStr = step.value.toString();
            for (let i = 0; i < valStr.length; i++) {
                const col = step.colEnd - (valStr.length - 1 - i);
                keys.push(`grid-${step.row}-${col}`);
            }
        }
    });
    return keys;
});

const activeKey = computed(() => {
    if (!isSelectionComplete.value) return null;
    for (const key of orderedKeys.value) {
        const val = userInputs.value[key];
        if (!val || !checkValueCorrectness(key, val)) return key;
    }
    return null; 
});

const waitingForDropIndex = computed(() => {
    if (!activeKey.value) return null;
    const info = getStepInfoByKey(activeKey.value);
    if (!info) return null;
    const { step } = info;
    
    if (step.type === 'remainder') {
        const activeCol = parseInt(activeKey.value.split('-')[2]);
        if (activeCol === step.colEnd) {
            if (!selectedIndices.value.includes(step.dividendIndexToDrop)) {
                return step.dividendIndexToDrop;
            }
        }
    }
    return null;
});

const getStepInfoByKey = (key) => {
    for (let i = 0; i < solutionSteps.value.length; i++) {
        const s = solutionSteps.value[i];
        if (s.type === 'quotient' && `q-${s.index}` === key) return { step: s, index: i };
        if (s.type !== 'quotient') {
             const valStr = s.value.toString();
             for (let j = 0; j < valStr.length; j++) {
                 const col = s.colEnd - (valStr.length - 1 - j);
                 if (`grid-${s.row}-${col}` === key) return { step: s, index: i };
             }
        }
    }
    return null;
};

watch(activeKey, (newKey) => {
    if (newKey && !waitingForDropIndex.value) {
        nextTick(() => { 
            const el = inputsRef.value[newKey]; 
            if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } 
        });
    } else if (isSelectionComplete.value && orderedKeys.value.length > 0 && !newKey) {
        checkFullSuccess();
    }
    calculateHint();
});

watch(waitingForDropIndex, (newVal) => {
    if (newVal === null && activeKey.value) {
        nextTick(() => { const el = inputsRef.value[activeKey.value]; if (el) el.focus(); });
    }
    calculateHint();
});

const handleDigitClick = (index) => {
    if (isTransitioning.value) return;

    if (!isSelectionComplete.value) {
        const currentLen = selectedIndices.value.length;
        if (selectedIndices.value.includes(index)) {
            if (index === selectedIndices.value[currentLen - 1]) selectedIndices.value.pop();
            calculateHint();
            return;
        }
        if (index !== currentLen) return; 

        selectedIndices.value.push(index);
        
        const requiredTake = solutionSteps.value[0].index + 1;
        const currentStr = selectedIndices.value.map(i => dividend.value.toString()[i]).join('');
        
        if (selectedIndices.value.length === requiredTake) {
             if (parseInt(currentStr) >= divisor.value) {
                 isSelectionComplete.value = true;
                 nextTick(() => { if(activeKey.value) focusInput(activeKey.value); });
             }
        }
        calculateHint();
        return;
    }

    if (waitingForDropIndex.value !== null) {
        if (index === waitingForDropIndex.value) {
            selectedIndices.value.push(index);
            const info = getStepInfoByKey(activeKey.value);
            if (info && info.step.type === 'remainder') {
                userInputs.value[activeKey.value] = info.step.nextDigit;
            }
        }
    }
};

const handleInputChange = (key, value) => {
    if (waitingForDropIndex.value !== null && key === activeKey.value) return;
    if (!/^\d*$/.test(value)) return;
    const val = value.slice(-1); 
    userInputs.value[key] = val;
    checkFullSuccess();
    calculateHint();
};

const handleKeypadPress = (num) => {
    if (isTransitioning.value) return;

    if (!isSelectionComplete.value) {
        const expectedIndex = selectedIndices.value.length;
        const digitStr = dividend.value.toString()[expectedIndex];
        if (digitStr && parseInt(digitStr) === num) {
            handleDigitClick(expectedIndex);
        }
        return;
    }

    if (waitingForDropIndex.value !== null) {
        const digitStr = dividend.value.toString()[waitingForDropIndex.value];
        const digit = parseInt(digitStr);
        if (num === digit) {
            handleDigitClick(waitingForDropIndex.value);
        }
        return;
    }

    if (activeKey.value) {
        handleInputChange(activeKey.value, num.toString());
    }
};

const handleDelete = () => {
    if (isTransitioning.value) return;

    if (!isSelectionComplete.value && selectedIndices.value.length > 0) {
         selectedIndices.value.pop();
         calculateHint();
         return;
    }
    if (activeKey.value && userInputs.value[activeKey.value]) {
         userInputs.value[activeKey.value] = '';
    }
};

const checkValueCorrectness = (key, val) => {
    if (!val) return false;
    const info = getStepInfoByKey(key);
    if (!info) return false;
    const { step } = info;
    const intVal = parseInt(val);

    if (step.type === 'quotient') return intVal === step.value;
    
    const valStr = step.value.toString();
    const col = parseInt(key.split('-')[2]);
    const startCol = step.colEnd - valStr.length + 1;
    const digitIndex = col - startCol;
    return intVal === parseInt(valStr[digitIndex]);
};

const checkFullSuccess = async () => {
    if (isSuccess.value || isTransitioning.value) return;

    const allDone = orderedKeys.value.every(k => checkValueCorrectness(k, userInputs.value[k]));
    if (allDone && orderedKeys.value.length > 0) {
        isSuccess.value = true;
        isTransitioning.value = true; 
        const rewardAmount = 2;

        try {
            await gamificationStore.addCoins('gold', rewardAmount); 
            await saveProgressToCloud(rewardAmount);
        } catch (error) {
            console.error("Fallo de sincronización en División:", error);
        }

        const frases = ["¡Excelente!", "¡Muy bien!", "¡Lo lograste!", "¡Eres genial!"];
        speak(`${frases[Math.floor(Math.random() * frases.length)]} Ganaste ${rewardAmount} monedas de oro.`);

        if (scrollContainer.value) {
            scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
        }

        if (activeExerciseIndex.value < MAX_EXERCISES - 1) {
            setTimeout(() => {
                activeExerciseIndex.value++;
                isTransitioning.value = false; 
                generateNewProblem(); 
            }, 1500);
        } else {
            setTimeout(() => {
                showCoinRain.value = true;
                speak("¡Misión cumplida! Completaste la serie.");
            }, 5000);
        }
    }
};

const focusInput = (key) => {
    const el = inputsRef.value[key];
    if (el) el.focus();
};

const resetSequence = () => {
    activeExerciseIndex.value = 0;
    generateNewProblem();
};

const generateNewProblem = () => {
    let newDivisor, newDividend;
    if (forcedDivisor.value !== 'random') newDivisor = parseInt(forcedDivisor.value); 
    else newDivisor = Math.floor(Math.random() * 8) + 2; 
    
    if (difficulty.value === 1) newDividend = Math.floor(Math.random() * 800) + 100; 
    else newDividend = Math.floor(Math.random() * 9000) + 1000; 
    
    if (newDividend < newDivisor * 2) newDividend = newDivisor * 12;
    setProblem(newDividend, newDivisor);
};

const setProblem = (div, dvr) => {
    divisor.value = dvr;
    dividend.value = div;
    userInputs.value = {};
    selectedIndices.value = [];
    isSelectionComplete.value = false;
    showCoinRain.value = false;
    isSuccess.value = false;
    isTransitioning.value = false;
    inputsRef.value = {};
    solutionSteps.value = solveDivision(div, dvr);
    if (scrollContainer.value) scrollContainer.value.scrollTop = 0;
    calculateHint();
};

onMounted(resetSequence);
watch([difficulty, forcedDivisor], resetSequence);

const calculateHint = () => {
    if (isSuccess.value) {
        currentHint.value = { 
          message: activeExerciseIndex.value === MAX_EXERCISES - 1 ? "¡SERIE COMPLETADA! ¡Eres un genio!" : "¡Muy bien! ¡Vamos por el siguiente!", 
          activeKeys: [], theme: THEMES[0] 
        };
        return;
    }

    if (!isSelectionComplete.value) {
        const divStr = dividend.value.toString();
        const selStr = selectedIndices.value.map(i => divStr[i]).join('');
        const selVal = parseInt(selStr || '0');
        
        let msg = "Toca el primer número del dividendo.";
        if (selectedIndices.value.length > 0) {
             if (selVal < divisor.value) msg = `El ${selVal} es muy pequeño para ${divisor.value}. ¡Toca el siguiente número!`;
             else msg = "¡Perfecto! Ahora podemos empezar."; 
        }
        currentHint.value = { message: msg, activeKeys: [], theme: THEMES[2] };
        return;
    }

    if (waitingForDropIndex.value !== null) {
        const digit = dividend.value.toString()[waitingForDropIndex.value];
        currentHint.value = {
            message: `¡Muy bien! Ahora toca el ${digit} que salta para bajarlo.`,
            activeKeys: [activeKey.value], theme: THEMES[3] 
        };
        return;
    }

    const info = getStepInfoByKey(activeKey.value);
    if (info) {
        const { step, index } = info;
        const theme = THEMES[index % 3]; 
        let msg = "";

        if (step.type === 'quotient') {
            msg = `¿Qué número multiplicado por ${divisor.value} se acerca a ${step.hintPart}? Piensa: ${divisor.value} x ${step.value} = ${step.value * divisor.value}.`;
        } else if (step.type === 'product') {
            msg = `Exacto. Ahora escribe el resultado de multiplicar ${step.quotientDigit} x ${divisor.value} = ${step.value}.`;
        } else if (step.type === 'remainder' || step.type === 'finalRemainder') {
            msg = `Ahora restamos: ${step.minuend} - ${step.subtrahend} = ${step.minuend - step.subtrahend}.`;
        }
        currentHint.value = { message: msg, activeKeys: [activeKey.value], theme };
    }
};

const getCellClass = (key) => {
    const isTarget = activeKey.value === key; 
    const val = userInputs.value[key];
    const isCorrect = checkValueCorrectness(key, val);
    let base = "w-8 h-9 text-center text-xl font-mono border-b-2 outline-none transition-all font-bold rounded-sm ";
    if (isSuccess.value) return base + "bg-green-100 text-green-800 border-green-500 shadow-inner";
    if (val && isCorrect) return base + "bg-green-100 border-transparent text-green-700 font-black";
    if (!isSelectionComplete.value) return base + "bg-transparent border-transparent"; 
    if (isTarget) {
        if (waitingForDropIndex.value !== null && !val) return base + "bg-orange-50 border-orange-300 border-2 border-dashed opacity-70";
        if (val && !isCorrect) return base + "bg-red-50 border-red-500 text-red-600 ring-2 ring-red-300 animate-shake";
        return base + "bg-yellow-50 border-yellow-500 ring-4 ring-yellow-200 scale-110 shadow-lg text-slate-900";
    }
    return base + "bg-white/50 border-slate-200/50";
};

const isFinalRemainder = (row, col) => {
    const lastStep = solutionSteps.value[solutionSteps.value.length - 1];
    return lastStep?.type === 'finalRemainder' && row === lastStep.row && col === lastStep.colEnd;
};
</script>

<template>
  <div class="h-[100dvh] w-full bg-white flex justify-center overflow-hidden font-sans select-none text-slate-900">
    <div class="w-full max-w-[500px] h-full flex flex-col bg-blue-600 shadow-2xl relative overflow-hidden mx-auto animate-fade-in border-x border-slate-100">
    
        <div v-if="showCoinRain" class="z-[200]">
            <CoinRain type="gold" :count="50" />
        </div>
        
        <header class="flex-none pt-2 px-4 pb-2 z-10 text-white">
            <div class="flex items-center justify-between w-full">
                <button @click="emit('back')" class="text-blue-100 hover:text-white flex items-center gap-2 font-bold">
                    <ArrowLeft :size="24" /> Volver
                </button>
                <h1 class="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tighter">División</h1>
                <button @click="resetSequence" class="p-1.5 rounded-lg bg-yellow-500 shadow-md">
                    <RefreshCw :size="18" />
                </button>
            </div>
            
            <div class="flex flex-row gap-2 items-center w-full justify-center mt-2">
                  <div class="flex bg-blue-700/50 p-1 rounded-lg border border-blue-500/50">
                    <button @click="difficulty = 1" :class="`px-3 py-1 rounded font-bold text-sm ${difficulty===1 ? 'bg-white text-blue-700' : 'text-blue-100'}`">N1</button>
                    <button @click="difficulty = 2" :class="`px-3 py-1 rounded font-bold text-sm ${difficulty===2 ? 'bg-white text-blue-700' : 'text-blue-100'}`">N2</button>
                  </div>
                  <div class="flex bg-blue-700/50 p-1.5 rounded-lg border border-blue-500/50">
                    <select v-model="forcedDivisor" @change="resetSequence" class="font-black text-sm text-white bg-transparent outline-none appearance-none">
                        <option value="random" class="text-slate-900">ALEATORIA</option>
                        <option v-for="n in 10" :key="n" :value="n" class="text-slate-900">TABLA DEL {{ n }}</option>
                    </select>
                  </div>
                  <button @click="showTableModal = true" class="p-2 bg-blue-700/50 rounded-lg text-blue-100 border border-blue-500/50">
                      <HelpCircle :size="18" />
                  </button>
            </div>
        </header>

        <div class="flex-none px-4 z-10">
            <div :class="`w-full p-2 sm:p-3 rounded-xl shadow-lg border-l-8 flex gap-4 items-center bg-white ${currentHint.theme.border}`">
                <div class="w-10 h-10 flex items-center justify-center shrink-0">
                    <OwlImage customClass="w-full h-full object-contain" />
                </div>
                <div>
                    <h3 :class="`font-black text-[10px] uppercase tracking-widest mb-0.5 ${currentHint.theme.text}`">
                        {{ isSuccess ? '¡Excelente!' : (!isSelectionComplete ? 'Paso 1: Selección' : 'Profesor Búho Dice:') }}
                    </h3>
                    <p class="text-sm font-bold text-slate-700 leading-tight">{{ currentHint.message }}</p>
                </div>
            </div>
        </div>

        <main class="flex-1 w-full overflow-hidden relative bg-blue-600 rounded-t-[2rem] mt-2 shadow-inner">
            <div ref="scrollContainer" class="w-full h-full overflow-y-auto p-4 flex flex-col items-center scrollbar-hide">
                <div class="bg-[#fff9c4] border-4 border-[#fbc02d] rounded-2xl shadow-2xl p-2 w-full max-w-lg relative my-auto min-h-[350px]"
                     :class="isSuccess ? 'bg-green-100 border-green-400' : ''"
                     style="background-image: linear-gradient(#e1f5fe 1px, transparent 1px); background-size: 100% 2em; padding-top: 2rem; padding-bottom: 2rem;">
                    
                    <div v-if="isSuccess" class="absolute inset-0 flex items-start justify-center z-50 pointer-events-none animate-fade-in pt-24">
                         <Check class="w-64 h-64 text-green-500/50" stroke-width="5" />
                    </div>

                    <div class="absolute -top-4 -left-2 bg-white text-slate-700 font-black text-lg w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-slate-200 z-20">
                        {{ activeExerciseIndex + 1 }}
                    </div>

                    <div class="flex items-start gap-4 pl-2 relative z-10 justify-center">
                        <div class="flex flex-col relative">
                              <div class="flex relative justify-center">
                                  <div v-for="(digit, idx) in dividend.toString()" :key="`d-${idx}`" 
                                    @click="handleDigitClick(idx)"
                                    :class="`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-2xl font-black font-mono border-b-2 transition-all cursor-pointer rounded-md mx-0.5
                                        ${selectedIndices.includes(idx) ? 'bg-green-200 text-green-900 border-green-500 shadow-sm' : 'border-transparent text-slate-700 hover:bg-white/50'}
                                        ${((!isSelectionComplete && idx === selectedIndices.length) || (waitingForDropIndex === idx)) ? 'animate-bounce bg-green-100 ring-2 ring-green-400 z-50' : ''}`">
                                      {{ digit }}
                                  </div>
                              </div>

                              <div class="grid mt-1" :style="{ gridTemplateColumns: `repeat(${dividend.toString().length}, min-content)` }">
                                  <template v-for="r in ((solutionSteps.length * 2) + 2)" :key="`row-${r}`">
                                      <div v-for="(d, c) in dividend.toString()" :key="`cell-${r}-${c}`" class="w-8 h-8 sm:w-10 sm:h-10 p-0.5 relative flex items-center justify-center mx-0.5">
                                          <input v-if="orderedKeys.includes(`grid-${r}-${c}`)"
                                              :ref="(el) => setRef(`grid-${r}-${c}`, el)"
                                              type="tel" autocomplete="off" readonly inputmode="none"
                                              :value="userInputs[`grid-${r}-${c}`]"
                                              :disabled="activeKey !== `grid-${r}-${c}` && !isSuccess" 
                                              :class="getCellClass(`grid-${r}-${c}`)"
                                              @click="activeKey.value = `grid-${r}-${c}`" />
                                          <div v-if="solutionSteps.some(s => s.type === 'product' && s.row === r && c >= s.colEnd - s.value.toString().length + 1 && c <= s.colEnd)" 
                                              class="absolute bottom-0 left-0 right-0 border-b-2 border-slate-800 pointer-events-none"></div>
                                      </div>
                                  </template>
                              </div>
                        </div>

                        <div class="flex flex-col relative">
                            <div class="border-b-2 border-l-2 border-slate-800 px-3 py-1 h-10 flex items-center justify-center min-w-[60px] bg-white/50">
                                <span class="text-2xl font-black text-slate-800">{{ divisor }}</span>
                            </div>
                            <div class="flex gap-1 justify-start flex-wrap max-w-[150px] mt-2">
                                <div v-for="(digit, idx) in dividend.toString()" :key="`q-${idx}`">
                                      <input v-if="solutionSteps.some(s => s.type === 'quotient' && s.index === idx)"
                                        :ref="(el) => setRef(`q-${idx}`, el)"
                                        type="tel" readonly inputmode="none"
                                        :value="userInputs[`q-${idx}`]"
                                        :disabled="activeKey !== `q-${idx}` && !isSuccess"
                                        :class="getCellClass(`q-${idx}`)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="flex-none bg-white z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <VirtualKeypad @press="handleKeypadPress" @delete="handleDelete" />
        </footer>

        <div v-if="showTableModal" class="absolute inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" @click.self="showTableModal = false">
            <div class="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[400px] border-4 border-blue-200 overflow-hidden flex flex-col max-h-[80vh]">
                <div class="bg-blue-50 p-3 border-b flex justify-between items-center text-slate-700 font-black">
                    <span class="uppercase tracking-widest text-xs">Tabla del {{ divisor }}</span>
                    <button @click="showTableModal = false" class="p-1 rounded-full hover:bg-red-50 hover:text-red-600 transition"><CloseIcon :size="20" /></button>
                </div>
                <div class="overflow-y-auto p-3 bg-white scrollbar-hide">
                    <div class="grid grid-cols-1 gap-2">
                        <div v-for="item in multiplicationTable" :key="item.n2" class="flex justify-between items-center p-2 rounded-xl border border-blue-100 bg-blue-50/50 shadow-sm">
                            <span class="text-lg font-bold text-slate-600 font-mono">{{ item.n1 }} × {{ item.n2 }}</span>
                            <span class="text-xl font-black text-blue-600">= {{ item.res }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.animate-shake { animation: shake 0.4s; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>