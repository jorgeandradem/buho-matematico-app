<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { 
  ChevronLeft, Eraser, X as CloseIcon, 
  Plus, Minus, X as MultiplyIcon, Divide, 
  Check, BookOpen 
} from 'lucide-vue-next';
import CoinRain from './CoinRain.vue';
import VirtualKeypad from './VirtualKeypad.vue';
import { useGamificationStore } from '../stores/useGamificationStore';
import { speak } from '../utils/voice';

// --- INICIO INTEGRACIÓN FIREBASE ---
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
// --- FIN INTEGRACIÓN FIREBASE ---

const props = defineProps({
  operation: { type: String, default: 'add' },
  difficulty: { type: Number, default: 1 }
});

const emit = defineEmits(['back']);
const gamificationStore = useGamificationStore(); 

// --- ESTADOS ---
const showSolution = ref(false);
const showCoinRain = ref(false); 
const activeExerciseIndex = ref(0);
const selectedHelpTable = ref(1);

// --- MOTOR DE VALIDACIÓN ESTRICTA ---
const exercises = ref([]); 
const currentSteps = ref([]); 
const currentStepIdx = ref(0); 
const userInputs = ref({}); 
const isTransitioning = ref(false); 

// ✅ INTEGRACIÓN: Ahora 'add' devuelve cobre para activar los retos diarios
const rewardCoinType = computed(() => {
  if (props.operation === 'div') return 'gold';
  if (props.operation === 'add') return 'copper';
  return 'silver';
});

// --- FUNCIÓN SILENCIOSA PARA GUARDAR EN NUBE ---
const saveProgressToCloud = async (puntosGanados) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      stats: { 
        puntos: increment(puntosGanados),
        lastActivity: Date.now()
      }
    }, { merge: true });
    console.log(`☁️ +${puntosGanados} guardados en la nube.`);
  } catch (error) {
    console.error("Error guardando en nube:", error);
  }
};

// --- TABLAS DE AYUDA ---
const helpTableData = computed(() => {
    const tableNum = selectedHelpTable.value;
    const list = [];
    const symbol = operatorSymbol.value; 
    for (let i = 1; i <= 10; i++) {
        let n1, n2, res;
        if (props.operation === 'add') { n1 = tableNum; n2 = i; res = n1 + n2; } 
        else if (props.operation === 'sub') { n2 = tableNum; res = i; n1 = n2 + res; } 
        else if (props.operation === 'mult') { n1 = tableNum; n2 = i; res = n1 * n2; } 
        else { n2 = tableNum; res = i; n1 = n2 * res; }
        list.push({ n1, op: symbol, n2, res });
    }
    return list;
});

const operatorSymbol = computed(() => {
    if (props.operation === 'add') return '+';
    if (props.operation === 'sub') return '-';
    if (props.operation === 'mult') return '×';
    if (props.operation === 'div') return '÷';
    return '?';
});

const opSymbol = computed(() => {
    if (props.operation === 'sub') return '-';
    if (props.operation === 'mult') return '×';
    if (props.operation === 'div') return '÷';
    return '+';
});

const operationConfig = computed(() => {
  const configs = {
    add: { icon: Plus, color: 'bg-green-500', label: 'Sumar' },
    sub: { icon: Minus, color: 'bg-orange-500', label: 'Restar' },
    mult: { icon: MultiplyIcon, color: 'bg-purple-500', label: 'Multiplicar' },
    div: { icon: Divide, color: 'bg-blue-500', label: 'Dividir' }
  };
  return configs[props.operation] || configs.add;
});

const themeColors = computed(() => {
    const map = {
        add: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', iconBg: 'bg-green-500' },
        sub: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', iconBg: 'bg-orange-500' },
        mult: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-500' },
        div: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', iconBg: 'bg-blue-500' }
    };
    return map[props.operation] || map.add;
});

const getOperatorColorClass = () => {
    if (props.operation === 'add') return 'text-green-500';
    if (props.operation === 'sub') return 'text-orange-500';
    if (props.operation === 'mult') return 'text-purple-600';
    return 'text-blue-500';
};

// --- GENERADOR ---
const generateRandomExercise = (id) => {
  let top, bot;
  if (props.operation === 'sub') {
    top = Math.floor(Math.random() * 900) + 100; 
    bot = Math.floor(Math.random() * (top - 50)) + 10;
    if (bot >= top) bot = top - 1;
  } else if (props.operation === 'mult') {
    top = Math.floor(Math.random() * 800) + 100;
    bot = Math.floor(Math.random() * 8) + 2;
  } else if (props.operation === 'div') {
    bot = Math.floor(Math.random() * 8) + 2; 
    let cociente = Math.floor(Math.random() * 20) + 1;
    top = bot * cociente;
  } else { 
    top = Math.floor(Math.random() * 800) + 100; 
    bot = Math.floor(Math.random() * 800) + 100;
  }
  return { id: Math.random().toString(36).substr(2, 9), top, bot, completed: false };
};

// --- CEREBRO DIDÁCTICO ---
const calculateStepsForExercise = (ex) => {
    const steps = [];
    const tDigits = ex.top.toString().split('').reverse().map(Number);
    const bDigits = ex.bot.toString().split('').reverse().map(Number);
    const maxLength = Math.max(tDigits.length, bDigits.length);

    if (props.operation === 'add') {
        let carry = 0;
        for (let i = 0; i <= maxLength; i++) {
            if (i >= tDigits.length && i >= bDigits.length && carry === 0) break;
            const t = tDigits[i] || 0;
            const b = bDigits[i] || 0;
            const sum = t + b + carry;
            const resDigit = sum % 10;
            const nextCarry = Math.floor(sum / 10);

            let hintMsg = `Suma ${t} + ${b}`;
            if (carry > 0) hintMsg += ` + ${carry} (que llevabas)`;
            hintMsg += ` = ${sum}.`;

            if (nextCarry > 0) {
                hintMsg += ` Escribe ${resDigit} y recuerda que el ${nextCarry} lo anotes en las llevadas.`;
            } else {
                hintMsg += ` Escribe ${resDigit}.`;
            }

            steps.push({ type: 'result', colIdx: i, val: resDigit, hint: hintMsg });

            if (nextCarry > 0) {
                steps.push({ 
                    type: 'carry', 
                    colIdx: i + 1, 
                    val: nextCarry, 
                    hint: `Anota el ${nextCarry} en las llevadas del vecino.` 
                });
            }
            carry = nextCarry;
        }
    }
    else if (props.operation === 'sub') {
        const workTop = [...tDigits];
        const originalTop = [...tDigits]; 

        for (let i = 0; i < maxLength; i++) {
            let t = workTop[i] || 0;
            const b = bDigits[i] || 0;

            if (t < b) {
                let j = i + 1;
                while (j < workTop.length && workTop[j] === 0) j++;
                
                if (j < workTop.length) {
                    const lenderVal = workTop[j];
                    steps.push({ 
                        type: 'new_top', colIdx: j, val: lenderVal - 1, 
                        hint: `Eres ${lenderVal} y prestas 1 decena. Al prestar 1, tu valor disminuye: ${lenderVal} - 1 = ${lenderVal - 1}. Escribe ${lenderVal - 1}.` 
                    });
                    workTop[j]--;

                    for (let k = j - 1; k > i; k--) {
                        steps.push({ 
                            type: 'new_top', colIdx: k, val: 9, 
                            hint: `Eras 0. Recibiste 10 y prestaste 1 a la derecha. 10 - 1 = 9. Escribe 9.` 
                        });
                        workTop[k] = 9;
                    }

                    let didacticText = "";
                    let newVal = t + 10;
                    
                    if (workTop[i] < originalTop[i]) {
                        didacticText = `Recuerda que prestaste 1, por eso ahora eres ${workTop[i]}. Pides 1 decena (10) prestada. 10 + ${workTop[i]} = ${newVal}. Escribe ${newVal}.`;
                    } else {
                        didacticText = `Recibes 1 decena (que son 10 unidades). 10 + ${t} = ${newVal}. Escribe ${newVal}.`;
                    }

                    steps.push({ 
                        type: 'borrower', colIdx: i, val: newVal, 
                        hint: didacticText
                    });
                    
                    workTop[i] += 10;
                    t += 10;
                }
            }
            const res = t - b;
            steps.push({ 
                type: 'result', colIdx: i, val: res, 
                hint: `Ahora resta: ${t} - ${b} = ${res}. Escribe ${res}.` 
            });
        }
    }
    else if (props.operation === 'mult') {
        let carry = 0;
        const b = ex.bot;
        for (let i = 0; i < tDigits.length + 1; i++) {
            if (i >= tDigits.length && carry === 0) break;
            const t = tDigits[i] || 0;
            
            if (i >= tDigits.length && carry > 0) {
                 steps.push({ 
                     type: 'result', 
                     colIdx: i, 
                     val: carry, 
                     hint: `Ya no hay más números. Baja el ${carry} que llevabas. Escribe ${carry}.` 
                 });
                 break;
            }

            const baseProduct = t * b;
            const totalProduct = baseProduct + carry;
            const resDigit = totalProduct % 10;
            const nextCarry = Math.floor(totalProduct / 10);

            let hint = `Multiplica ${b} por ${t} es igual a ${baseProduct}.`;
            if (carry > 0) hint += ` Más ${carry} que llevabas es igual a ${totalProduct}.`;
            
            if (nextCarry > 0) {
                hint += ` Escribe ${resDigit} y recuerda que llevas ${nextCarry}.`;
            } else {
                hint += ` Escribe ${resDigit}.`;
            }

            steps.push({ type: 'result', colIdx: i, val: resDigit, hint: hint });
            
            if (nextCarry > 0) {
                steps.push({ 
                    type: 'carry', 
                    colIdx: i + 1, 
                    val: nextCarry, 
                    hint: `Anota el ${nextCarry} que llevas en la siguiente columna.` 
                });
            }
            carry = nextCarry;
        }
    }
    else if (props.operation === 'div') {
        const res = ex.top / ex.bot;
        const resDigits = res.toString().split('').map(Number);
        resDigits.reverse().forEach((d, idx) => {
             steps.push({ type: 'result', colIdx: idx, val: d, hint: `Escribe ${d}` });
        });
    }
    return steps;
};

const setupExercise = () => {
    isTransitioning.value = false;
    currentStepIdx.value = 0;
    userInputs.value = {}; 
    const ex = exercises.value[activeExerciseIndex.value];
    if (ex) currentSteps.value = calculateStepsForExercise(ex);
};

// --- VISUALIZADOR ---
const currentExercise = computed(() => {
    const ex = exercises.value[activeExerciseIndex.value];
    if (!ex) return null;

    const tDigits = ex.top.toString().split('').reverse().map(Number);
    const bDigits = ex.bot.toString().split('').reverse().map(Number);
    const cols = [];
    const maxCols = Math.max(tDigits.length, bDigits.length) + 1;

    for (let i = 0; i <= 5; i++) { 
        if (i === 5) { cols.push({ colIdx: i, type: 'OPERATOR' }); continue; }
        if (i >= maxCols) { cols.push({ colIdx: i, type: 'GHOST' }); continue; }

        const activeStep = currentSteps.value[currentStepIdx.value];
        const isActive = activeStep && activeStep.colIdx === i;
        
        const carryKey = `carry-${i}`;
        const resultKey = `result-${i}`;
        const newTopKey = `new_top-${i}`; 
        const borrowerKey = `borrower-${i}`;

        const isNewTopVisible = !!userInputs.value[newTopKey] || (isActive && activeStep?.type === 'new_top');
        const newTopValue = userInputs.value[newTopKey]?.val || userInputs.value[newTopKey]?.tempVal || "";

        const isBorrowerVisible = !!userInputs.value[borrowerKey] || (isActive && activeStep?.type === 'borrower');
        const showOval = props.operation === 'add' || props.operation === 'mult' || (props.operation === 'sub' && isBorrowerVisible);
        
        const ovalDisplay = userInputs.value[carryKey]?.status === 'correct' ? userInputs.value[carryKey].val :
                            userInputs.value[borrowerKey]?.status === 'correct' ? userInputs.value[borrowerKey].val :
                            (userInputs.value[carryKey]?.tempVal || userInputs.value[borrowerKey]?.tempVal || "");

        const resultDisplay = userInputs.value[resultKey]?.status === 'correct' ? userInputs.value[resultKey].val :
                              (userInputs.value[resultKey]?.tempVal || "");

        const isTopActive = props.operation === 'mult' && isActive && i < tDigits.length;

        cols.push({
            colIdx: i,
            type: 'DATA',
            top: tDigits[i],
            bot: props.operation === 'mult' ? ex.bot : bDigits[i],
            isTopVisible: i < tDigits.length,
            isBotVisible: i < (props.operation === 'mult' ? 1 : bDigits.length),
            fullBot: ex.bot,
            
            showOval,
            ovalDisplay,
            resultDisplay,
            
            isNewTopVisible, 
            newTopValue,
            showStrikeThrough: !!userInputs.value[newTopKey],
            
            isNewTopActive: isActive && activeStep.type === 'new_top',
            isCarryActive: isActive && (activeStep.type === 'carry' || activeStep.type === 'borrower'),
            isLenderActive: isActive && activeStep.type === 'lender',
            isResultActive: isActive && activeStep.type === 'result',
            
            isTopActive,

            isNewTopCorrect: !!userInputs.value[newTopKey],
            isCarryCorrect: !!userInputs.value[carryKey] || !!userInputs.value[borrowerKey],
            isResultCorrect: !!userInputs.value[resultKey]
        });
    }
    return { ...ex, processedCols: cols };
});

const handleKeypadPress = (num) => {
    if (isTransitioning.value) return; 
    if (!currentExercise.value) return;
    if (currentStepIdx.value >= currentSteps.value.length) return;

    const step = currentSteps.value[currentStepIdx.value];
    const key = `${step.type}-${step.colIdx}`;
    
    let currentInputStr = userInputs.value[key]?.tempVal || "";
    let newInputStr = currentInputStr + num.toString();
    let expectedStr = step.val.toString();

    if (parseInt(newInputStr) === step.val) {
        userInputs.value[key] = { val: step.val, status: 'correct', tempVal: "" };
        currentStepIdx.value++;
        if (currentStepIdx.value >= currentSteps.value.length) handleExerciseComplete();
    } 
    else if (expectedStr.startsWith(newInputStr)) {
        userInputs.value[key] = { val: parseInt(newInputStr), status: 'temp', tempVal: newInputStr };
    } 
    else {
        if (navigator.vibrate) navigator.vibrate(200);
        if (userInputs.value[key]?.status === 'temp') userInputs.value[key] = null;
    }
};

const handleDelete = () => {
    if (isTransitioning.value) return;
    const step = currentSteps.value[currentStepIdx.value];
    const key = `${step.type}-${step.colIdx}`;
    if (userInputs.value[key]?.status === 'temp') {
        userInputs.value[key] = null;
    }
};

// ✅ INTEGRACIÓN: Manejador asíncrono para asegurar racha y retos
const handleExerciseComplete = async () => {
    const idx = activeExerciseIndex.value;
    exercises.value[idx].completed = true;
    isTransitioning.value = true; 

    // Sistema de recompensas preciso
    let amount = (props.operation === 'add') ? 15 : 2; // 15 para Suma (Retos cobre)
    
    if (props.operation === 'sub') {
        amount = 5; // Resta: 5 Platas
    } else if (props.operation === 'mult') {
        amount = 8; // Multiplicación: 8 Platas
    } else if (props.operation === 'div') {
        amount = 2; // División: 2 Oros
    }

    // Esperamos a que el Store termine la sincronización
    await gamificationStore.addCoins(rewardCoinType.value, amount);
    
    // INTEGRACIÓN FIREBASE: GUARDADO SILENCIOSO
    saveProgressToCloud(amount); 

    const frases = ["¡Excelente!", "¡Muy bien!", "¡Lo lograste!", "¡Eres genial!"];
    const frase = frases[Math.floor(Math.random() * frases.length)];
    speak(`${frase}`);

    if (idx === exercises.value.length - 1) {
        setTimeout(() => {
            showCoinRain.value = true;
            speak("¡Fantástico! Has terminado todo.");
        }, 2000);
    } else {
        setTimeout(() => {
            activeExerciseIndex.value++;
            setupExercise(); 
        }, 1500);
    }
};

const owlAdvice = computed(() => {
    const ex = currentExercise.value;
    if (ex && ex.completed) return "¡Muy bien! Siguiente...";
    const step = currentSteps.value[currentStepIdx.value];
    if (step) return step.hint;
    return "¡Vamos!";
});

onMounted(() => {
    exercises.value = Array.from({ length: 5 }, (_, i) => generateRandomExercise(i));
    setupExercise();
});

const fullReset = () => {
    showCoinRain.value = false;
    activeExerciseIndex.value = 0;
    exercises.value = Array.from({ length: 5 }, (_, i) => generateRandomExercise(i));
    setupExercise();
    showSolution.value = false;
};
</script>

<template>
  <div class="h-[100dvh] w-full bg-slate-100 flex justify-center overflow-hidden font-sans select-none">
    
    <div v-if="showCoinRain">
        <CoinRain :type="rewardCoinType" :count="30" />
    </div>
    
    <div class="w-full max-w-xl h-full flex flex-col bg-white shadow-2xl relative">

        <div v-if="showSolution" class="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" @click.self="showSolution = false">
            <div class="bg-white rounded-2xl shadow-2xl w-[90%] max-w-sm border-4 border-indigo-100 overflow-hidden flex flex-col max-h-[85vh]">
                <div class="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center text-slate-700 font-black shrink-0">
                    <div class="flex items-center gap-2"><BookOpen :size="20" class="text-indigo-500"/> Tablas de Ayuda</div>
                    <button @click="showSolution = false" class="p-1 bg-white rounded-full text-slate-400 hover:text-red-500 transition shadow-sm"><CloseIcon :size="20" /></button>
                </div>
                <div class="p-3 bg-white border-b border-slate-100 shrink-0">
                    <div class="grid grid-cols-5 gap-2">
                        <button v-for="n in 10" :key="n" @click="selectedHelpTable = n" :class="['py-2 rounded-lg font-black text-sm transition-all', selectedHelpTable === n ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-500 hover:bg-indigo-100']">{{ n }}</button>
                    </div>
                </div>
                <div class="overflow-y-auto p-4 bg-slate-50 scrollbar-thin flex-1">
                   <div class="flex flex-col gap-2">
                       <div v-for="(item, idx) in helpTableData" :key="idx" class="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                           <span class="text-lg font-bold text-slate-600 font-mono">{{ item.n1 }} <span class="text-indigo-400 mx-1">{{ item.op }}</span> {{ item.n2 }}</span>
                           <span class="text-xl font-black text-indigo-600">= {{ item.res }}</span>
                       </div>
                   </div>
                </div>
            </div>
        </div>
        
        <div class="flex-none pt-2 px-4 pb-1 z-10 bg-white/90 backdrop-blur border-b border-slate-200 flex flex-col gap-1 md:gap-2">
            <div class="flex justify-between items-center h-10 md:h-14">
                <div class="flex items-center gap-3">
                    <button @click="$emit('back')" class="p-1.5 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs md:text-sm flex items-center gap-1 active:scale-95 transition"><ChevronLeft class="w-4 h-4 md:w-5 md:h-5"/> Volver</button>
                    <div :class="`flex items-center gap-2 px-3 py-1 rounded-xl border-2 ${themeColors.bg} ${themeColors.border} shadow-sm`">
                         <div :class="`p-1 rounded-md ${themeColors.iconBg} flex items-center justify-center`"><component :is="operationConfig.icon" class="text-white w-3 h-3 md:w-4 md:h-4" stroke-width="4" /></div>
                         <span :class="`font-black text-xs md:text-sm uppercase ${themeColors.text}`">Nivel 1</span>
                    </div>
                </div>
                <div class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Ej {{ activeExerciseIndex + 1 }} / 5</div>
                <div class="flex gap-2">
                    <button @click="fullReset" class="p-2 md:p-2.5 bg-white shadow-sm rounded-lg text-slate-500 active:scale-95 transition hover:text-indigo-600"><Eraser class="w-4 h-4 md:w-5 md:h-5" /></button>
                    <button @click="showSolution = true" :class="`p-2 md:p-2.5 rounded-lg shadow-sm transition active:scale-95 ${showSolution ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300' : 'bg-white text-slate-500 hover:text-indigo-600'}`"><BookOpen class="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
            </div>
            
            <div class="w-full mb-1 z-30">
                <div class="bg-white/90 backdrop-blur-sm border-l-4 border-blue-500 rounded-r-xl p-3 shadow-md flex gap-3 items-center animate-fade-in">
                    <div class="text-2xl select-none">🦉</div>
                    <p class="text-slate-700 font-bold text-sm md:text-base leading-tight">{{ owlAdvice }}</p>
                </div>
            </div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center p-0 relative bg-slate-50 overflow-hidden">
            <div v-if="currentExercise" :key="currentExercise.id" class="w-[98%] max-w-lg flex flex-col justify-center h-full animate-fade-in">
                 
                 <div class="relative p-4 md:p-10 rounded-[2.5rem] border-4 w-full h-[95%] shadow-2xl flex flex-col justify-center items-center transition-all duration-500" 
                      :class="currentExercise.completed ? 'bg-green-100 border-green-400' : 'bg-[#fff9c4] border-yellow-400'"
                      style="background-image: linear-gradient(#e1f5fe 1px, transparent 1px); background-size: 100% 2.1rem;">
                    
                    <div v-if="currentExercise.completed" class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-fade-in">
                        <Check class="w-64 h-64 text-green-500/50 drop-shadow-sm" stroke-width="5" />
                    </div>

                    <div class="absolute top-0 bottom-0 left-4 md:left-8 w-0.5 bg-red-300 opacity-40"></div>
                    <div class="absolute -top-4 -left-2 bg-white text-slate-700 font-black text-lg md:text-xl w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md border-2 border-slate-200">{{ activeExerciseIndex + 1 }}</div>

                    <div class="w-full flex justify-center">
                        <div class="flex flex-row-reverse justify-center gap-1 md:gap-3 relative z-20">
                            
                            <div v-for="col in currentExercise.processedCols" :key="col.colIdx" class="flex flex-col items-center">
                                
                                <div v-if="col.type === 'OPERATOR'" class="w-14 md:w-[4.5rem] h-full flex flex-col items-center justify-end pb-16 md:pb-28">
                                     <div :class="`text-5xl md:text-7xl font-black ${getOperatorColorClass()}`">{{ opSymbol }}</div>
                                </div>

                                <div v-else-if="col.type === 'GHOST'" class="w-14 md:w-[4.5rem] pointer-events-none"></div>

                                <template v-else>
                                    <div class="h-[6rem] md:h-[8rem] flex flex-col justify-end items-center w-full mb-1 space-y-1">
                                        
                                        <div v-if="col.isNewTopVisible" 
                                             :class="[ 'flex shrink-0 items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-xl border-2 text-lg md:text-xl font-black shadow-sm transition-all z-20', 
                                                       col.isNewTopCorrect ? 'bg-blue-100 border-blue-500 text-blue-700' : 
                                                       col.isNewTopActive ? 'bg-white border-yellow-400 ring-2 ring-yellow-200 focus-neon scale-110' : 'bg-white border-slate-300' ]">
                                              {{ col.newTopValue }}
                                        </div>

                                        <div v-if="props.operation === 'sub' && col.showStrikeThrough" 
                                             class="text-red-500 font-black text-sm md:text-lg z-10 animate-fade-in-down shrink-0">
                                              -1
                                        </div>

                                        <div v-if="col.showOval" 
                                             :class="[ 'flex shrink-0 items-center justify-center w-10 h-8 md:w-16 md:h-10 rounded-xl border-2 text-xl md:text-2xl font-bold shadow-inner transition-all z-10', 
                                                       col.isCarryCorrect ? 'bg-green-100 border-green-500 text-green-700' : 
                                                       col.isCarryActive ? 'bg-white border-yellow-400 ring-2 ring-yellow-200 focus-neon scale-110' : 'bg-white border-slate-300' ]">
                                              {{ col.ovalDisplay }}
                                        </div>
                                    </div>

                                    <div class="w-14 md:w-[4.5rem] h-16 md:h-20 flex items-center justify-center text-5xl md:text-6xl font-mono font-bold text-slate-700 relative shrink-0">
                                        <div v-if="col.showStrikeThrough" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div class="w-full h-1 bg-red-500/80 -rotate-12"></div>
                                        </div>
                                        
                                        <div v-if="col.isTopActive" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-0.5 shadow-sm border border-green-200 z-50 animate-bounce">
                                            <Check class="w-4 h-4 text-green-600" stroke-width="4" />
                                        </div>

                                        {{ col.isTopVisible ? col.top : '' }}
                                    </div>
                                    
                                    <div class="w-14 md:w-[4.5rem] h-16 md:h-20 flex items-center justify-center text-5xl md:text-6xl font-mono font-bold text-slate-700 border-b-[4px] md:border-b-[6px] border-slate-800 shrink-0">
                                        {{ col.isBotVisible ? (props.operation === 'mult' ? col.fullBot : col.bot) : '' }}
                                    </div>

                                    <div :class="[ 'flex items-center justify-center w-14 h-16 md:w-[4.5rem] md:h-24 rounded-xl md:rounded-2xl border-2 text-5xl md:text-6xl mt-2 md:mt-4 shadow-inner transition-all shrink-0', 
                                                   col.isResultCorrect ? 'bg-green-100 border-green-500 text-green-700' : 
                                                   col.isResultActive ? 'bg-white border-yellow-400 ring-2 ring-yellow-200 focus-neon scale-110' : 'bg-white border-slate-300' ]">
                                          {{ col.resultDisplay }}
                                    </div>
                                </template>

                            </div>
                        </div>
                    </div>

                 </div>
            </div>
        </div>

        <div class="flex-none bg-white z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <VirtualKeypad @press="handleKeypadPress" @delete="handleDelete" />
        </div>
        
    </div>
  </div>
</template>

<style scoped>
.animate-shake { animation: shake 0.4s; }
@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);} }
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.scrollbar-thin::-webkit-scrollbar { width: 6px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }
.focus-neon { 
  border-color: #FACC15 !important; 
  border-width: 3px !important; 
  box-shadow: 0 0 15px rgba(250, 204, 21, 0.5); 
  animation: neon-pulse 1.5s infinite ease-in-out; 
  z-index: 50 !important; 
}
@keyframes neon-pulse {
  0% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.4); border-color: #eab308; }
  50% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.7); border-color: #facc15; }
  100% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.4); border-color: #eab308; }
}
</style>