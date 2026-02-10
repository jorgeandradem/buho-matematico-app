<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { 
  ChevronLeft, Eraser, Eye, EyeOff, HelpCircle, X as CloseIcon, 
  Plus, Minus, X as MultiplyIcon, Divide, ChevronDown, 
  Check 
} from 'lucide-vue-next';
import SmartGuide from './SmartGuide.vue';
import SimpleConfetti from './SimpleConfetti.vue';
import VirtualKeypad from './VirtualKeypad.vue';

const props = defineProps({
  operation: { type: String, default: 'add' },
  difficulty: { type: Number, default: 1 }
});

const emit = defineEmits(['back']);

// --- ESTADOS ---
const showSolution = ref(false);
const showConfetti = ref(false);
const activeExerciseIndex = ref(0);
const activeCell = ref(null); 
const currentInputTask = ref({ expected: null, nextFn: null, id: null, exIdx: null });
const selectedTableMode = ref('current');

watch(showSolution, (newVal) => { if (newVal) selectedTableMode.value = 'current'; });

// --- LÓGICA DE SOLUCIONES ---
const displayedSolutions = computed(() => {
    if (selectedTableMode.value === 'current') {
        return exercises.value.map(ex => {
            let res = 0;
            if (props.operation === 'add') res = ex.top + ex.bot;
            else if (props.operation === 'sub') res = ex.top - ex.bot;
            else if (props.operation === 'div') res = ex.top / ex.bot;
            else res = ex.top * ex.bot;
            return { id: ex.id, n1: ex.top, op: operatorSymbol.value, n2: ex.bot, result: res, isCurrent: true };
        });
    } else {
        const tableNum = parseInt(selectedTableMode.value);
        const list = [];
        for (let i = 1; i <= 10; i++) {
            let n1, op, n2, res;
            if (props.operation === 'add') { n1 = tableNum; op = '+'; n2 = i; res = n1 + n2; }
            else if (props.operation === 'sub') { n2 = tableNum; op = '-'; n1 = tableNum + i; res = i; }
            else if (props.operation === 'div') { n1 = tableNum * i; op = '÷'; n2 = tableNum; res = i; }
            else { n1 = tableNum; op = 'x'; n2 = i; res = n1 * n2; }
            list.push({ id: `tbl-${i}`, n1, op, n2, result: res, isCurrent: false });
        }
        return list;
    }
});

const operatorSymbol = computed(() => {
    if (props.operation === 'add') return '+';
    if (props.operation === 'sub') return '-';
    if (props.operation === 'mult') return 'x';
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
    let units = (top % 10);
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
    top = Math.floor(Math.random() * 800) + 100; bot = Math.floor(Math.random() * 800) + 100;
  }
  return { id: Math.random().toString(36).substr(2, 9), top, bot, completed: false, inputs: {} };
};

const exercises = ref(Array.from({ length: 5 }, (_, i) => generateRandomExercise(i)));

// --- MOTOR DE MATRIZ RÍGIDA (CEREBRO MATEMÁTICO INTEGRAL) ---
const processStandardOperation = (ex) => {
  if (!ex) return null;
  
  const tDigits = ex.top.toString().split('').reverse().map(Number);
  const bDigits = ex.bot.toString().split('').reverse().map(Number);
  const maxLength = Math.max(tDigits.length, bDigits.length);

  // --- SIMULADOR DE PRÉSTAMOS (RESTA) ---
  const finalTopDigits = [...tDigits]; 
  const borrowedStatus = new Array(maxLength).fill(false); 
  const originalTopDigits = [...tDigits]; 

  if (props.operation === 'sub') {
      for (let i = 0; i < maxLength; i++) {
          const topVal = finalTopDigits[i] || 0;
          const botVal = bDigits[i] || 0;
          
          if (topVal < botVal) {
              let j = i + 1;
              while (j < finalTopDigits.length) {
                  if (finalTopDigits[j] > 0) {
                      finalTopDigits[j] -= 1;
                      borrowedStatus[j] = true;
                      for (let k = j - 1; k >= i; k--) {
                          if (k === i) finalTopDigits[k] += 10;
                          else { finalTopDigits[k] = 9; borrowedStatus[k] = true; }
                      }
                      break;
                  }
                  j++;
              }
          }
      }
  }

  const columns = [];
  let carry = 0; 
  
  for (let i = 0; i <= 5; i++) {
      if (i === 5) {
          columns.push({ colIdx: i, type: 'OPERATOR' });
          continue;
      }
      if (i >= maxLength && (props.operation === 'sub' || carry === 0)) {
          if (i >= maxLength) {
             columns.push({ colIdx: i, type: 'GHOST' });
             continue;
          }
      }

      const tOrg = originalTopDigits[i] || 0; 
      const b = props.operation === 'mult' ? ex.bot : (bDigits[i] || 0);
      
      let resDigit = 0, ovalValue = 0, showOval = false;
      let owlMsgType = ''; 
      let subEffectiveTop = 0;
      let owlTotalSum = 0;
      let owlNextCarry = 0;

      // --- LÓGICA RESTA ---
      if (props.operation === 'sub') {
          subEffectiveTop = finalTopDigits[i] !== undefined ? finalTopDigits[i] : 0;
          resDigit = subEffectiveTop - b;
          
          const isLender = borrowedStatus[i]; 
          const valAfterLending = tOrg - (isLender ? 1 : 0); 
          const isBorrower = subEffectiveTop > valAfterLending; 

          if (isLender && isBorrower) {
              showOval = true; ovalValue = subEffectiveTop; owlMsgType = 'sub_lender_borrower';
          } else if (isBorrower) {
              showOval = true; ovalValue = subEffectiveTop; owlMsgType = 'sub_borrow_rx';
          } else if (isLender) {
              showOval = true; ovalValue = subEffectiveTop;
              owlMsgType = subEffectiveTop === 0 ? 'sub_lender_zero' : 'sub_lender_normal';
          } else {
              owlMsgType = 'sub_simple';
          }

      // --- LÓGICA SUMA / MULT ---
      } else {
          // Diferenciar Suma vs Mult
          const product = props.operation === 'mult' ? tOrg * b : tOrg + b;
          const valTotal = product + carry;
          
          resDigit = valTotal % 10;
          owlNextCarry = Math.floor(valTotal / 10);
          owlTotalSum = valTotal;

          if (props.operation === 'add') {
              if (carry > 0) owlMsgType = 'add_carry_rx'; 
              else if (owlNextCarry > 0) owlMsgType = 'add_carry_tx'; 
              else owlMsgType = 'add_simple';
          } else if (props.operation === 'mult') {
              // Nueva lógica para Multiplicación
              if (carry > 0) owlMsgType = 'mult_carry_rx';
              else if (owlNextCarry > 0) owlMsgType = 'mult_carry_tx';
              else owlMsgType = 'mult_simple';
          }

          if (carry > 0 || (props.operation === 'mult' && carry > 0)) {
             showOval = carry > 0;
             ovalValue = carry;
          }
          
          carry = owlNextCarry;
      }

      columns.push({ 
          colIdx: i, 
          type: 'DATA',
          top: tOrg, 
          bot: b, 
          isTopVisible: i < originalTopDigits.length,
          isBotVisible: i < (props.operation === 'mult' ? 1 : bDigits.length), 
          expectedResult: resDigit, 
          showOval, 
          ovalValue, 
          fullBot: ex.bot,
          // Datos Búho
          owlMsgType,
          subEffectiveTop,
          owlTotalSum,
          owlNextCarry,
          owlPrevCarry: (props.operation === 'add' || props.operation === 'mult' ? (showOval ? ovalValue : 0) : 0)
      });
  }
  return { ...ex, processedCols: columns };
};

const computedExercises = computed(() => {
  return exercises.value.map(ex => processStandardOperation(ex));
});

const currentExercise = computed(() => {
  if (activeExerciseIndex.value >= computedExercises.value.length) return null;
  return computedExercises.value[activeExerciseIndex.value];
});

// --- CEREBRO DEL BÚHO INTELIGENTE (3 OPERACIONES) ---
const owlAdvice = computed(() => {
  const ex = currentExercise.value;
  if (!activeCell.value || !ex) return "¡Vamos búho!";
  
  if (ex.completed) {
      if (activeExerciseIndex.value === exercises.value.length - 1) return "¡Felicidades!\nHas completado todo.";
      return "¡Excelente! Preparando el siguiente...";
  }

  const { type, colIdx } = activeCell.value;
  const col = ex.processedCols[colIdx];

  if (!col) return "Selecciona casilla.";

  // === RESTA AVANZADA ===
  if (props.operation === 'sub') {
      const effTop = col.subEffectiveTop;
      const orgTop = col.top;
      const bot = col.bot;

      if (type === 'carry') {
          if (col.owlMsgType === 'sub_borrow_rx') return `Resta ${orgTop} - ${bot}. No puedes. Pide 1 a tu vecino y quedas en ${effTop}. Escríbelo.`;
          if (col.owlMsgType === 'sub_lender_borrower') {
              if (orgTop === 0) return `Eras 0. Pediste 1 (10) y prestaste 1. Ahora eres ${effTop}. Escríbelo.`;
              return `Eras ${orgTop}. Prestaste 1 (quedaste en ${orgTop-1}). Pediste 1 prestado y ahora eres ${effTop}. Escríbelo.`;
          }
          if (col.owlMsgType === 'sub_lender_zero') return `Prestaste 1 ahora eres 0. Escríbelo.`;
          if (col.owlMsgType === 'sub_lender_normal') return `Prestaste 1 ahora eres ${effTop}. Escríbelo.`;
      }
      if (type === 'result') return `Resta ${effTop} - ${bot} = ${col.expectedResult}. Escríbelo.`;
  }

  // === SUMA AVANZADA ===
  if (props.operation === 'add') {
      if (type === 'carry') return `Escribe el ${col.ovalValue} que te dio tu vecino.`;
      if (type === 'result') {
          const t = col.top;
          const b = col.bot;
          const total = col.owlTotalSum;
          const nextC = col.owlNextCarry;
          const resD = col.expectedResult;

          if (col.owlMsgType === 'add_carry_rx') {
              return `Suma ${t} + ${b} = ${t+b}. Más ${col.ovalValue} que llevas son ${total}. Anota ${resD}${nextC > 0 ? ' y lleva ' + nextC : '.'}`;
          } else if (nextC > 0) {
              return `Suma ${t} + ${b} = ${total}. Anota ${resD} y escribe ${nextC} en las llevadas del vecino.`;
          } else {
              return `Suma ${t} + ${b} = ${total}. Escríbelo.`;
          }
      }
  }
  
  // === MULTIPLICACIÓN AVANZADA (NIVEL 1) ===
  // Nota: Nombrar primero al Multiplicador (bot) y luego al Multiplicando (top)
  if (props.operation === 'mult' && col.type === 'DATA') {
      if (type === 'carry') return `Escribe el ${col.ovalValue} que llevas de la multiplicación anterior.`;
      
      if (type === 'result') {
          const t = col.top;
          const b = col.bot; // En mult nivel 1, bot es un solo dígito
          const total = col.owlTotalSum;
          const nextC = col.owlNextCarry;
          const resD = col.expectedResult;
          const prevC = col.owlPrevCarry;

          if (col.owlMsgType === 'mult_carry_rx') {
              const baseProd = b * t; // Orden visual b x t
              return `Multiplica ${b} x ${t} = ${baseProd}. Más ${prevC} que llevas son ${total}. Escribe ${resD}${nextC > 0 ? ' y lleva ' + nextC : '.'}`;
          } else if (nextC > 0) {
              return `Multiplica ${b} x ${t} = ${total}. Escribe ${resD} y lleva ${nextC} en las unidades.`;
          } else {
              return `Multiplica ${b} x ${t} = ${total}. Escríbelo.`;
          }
      }
  }
  
  return "Toca la casilla y escribe.";
});

const handleKeypadPress = (num) => {
  const exIdx = activeExerciseIndex.value;
  if (exercises.value[exIdx].completed) return;

  if (!currentInputTask.value.id || !exercises.value[exIdx]) return;
  const { expected, id, nextFn } = currentInputTask.value;
  if (exercises.value[exIdx].inputs[id] === 'error') { exercises.value[exIdx].inputs[id] = null; exercises.value[exIdx].inputs[id + '_val'] = ""; }
  let cur = exercises.value[exIdx].inputs[id + '_val'] || "";
  let newVal = cur + num.toString();
  
  const expStr = expected.toString();
  
  if (parseInt(newVal) === expected) {
    exercises.value[exIdx].inputs[id] = 'correct'; 
    exercises.value[exIdx].inputs[id + '_val'] = ""; 
    nextTick(() => { if (nextFn) nextFn(); });
  } else if (newVal.length >= expStr.length) {
    exercises.value[exIdx].inputs[id] = 'error'; 
    exercises.value[exIdx].inputs[id + '_val'] = ""; 
    if (navigator.vibrate) navigator.vibrate(200);
  } else {
    exercises.value[exIdx].inputs[id + '_val'] = newVal;
  }
};

const handleDelete = () => {
    const exIdx = activeExerciseIndex.value;
    if (exercises.value[exIdx].completed) return; 
    if (!currentInputTask.value.id || !exercises.value[exIdx]) return;
    const { id } = currentInputTask.value;
    if (exercises.value[exIdx].inputs[id] === 'correct') return; 
    exercises.value[exIdx].inputs[id] = null; exercises.value[exIdx].inputs[id + '_val'] = "";
};

const handleFocus = (exIdx, type, colIdx, rowId, expectedVal, nextFn) => {
  if (exercises.value[exIdx].completed) return; 
  activeExerciseIndex.value = exIdx;
  const newId = `in-${exIdx}-c${colIdx}-${type}`;
  currentInputTask.value = { expected: expectedVal, nextFn, id: newId, exIdx };
  activeCell.value = { exIdx, type, colIdx, rowId };
};

const autoFocus = () => {
  nextTick(() => {
    const idx = activeExerciseIndex.value; const ex = currentExercise.value; 
    if(!ex) return;
    const firstDataCol = ex.processedCols.find(c => c.type === 'DATA' && c.colIdx === 0);
    if(firstDataCol) {
        // Inicio inteligente: si hay que pedir prestado o sumar llevada (y el ovalo es visible), empezamos ahí
        const startType = (firstDataCol.showOval) ? 'carry' : 'result';
        handleFocus(idx, startType, 0, null, startType==='carry' ? firstDataCol.ovalValue : firstDataCol.expectedResult, () => nextStepStd(idx, 0, startType));
    }
  });
};

const nextStepStd = (idx, colIdx, type) => {
  const ex = currentExercise.value; if (!ex) return;
  const col = ex.processedCols.find(c => c.colIdx === colIdx);

  // 1. De Óvalo a Resultado (Misma columna)
  if (type === 'carry') {
      handleFocus(idx, 'result', colIdx, null, col.expectedResult, () => nextStepStd(idx, colIdx, 'result'));
      return;
  }

  // 2. De Resultado a Siguiente Columna (Izquierda)
  const nextColIndex = colIdx + 1;
  const nextCol = ex.processedCols.find(c => c.colIdx === nextColIndex);

  if (nextCol && nextCol.type === 'DATA') {
      const nextHasAction = nextCol.showOval; 
      const nextType = nextHasAction ? 'carry' : 'result';
      handleFocus(idx, nextType, nextCol.colIdx, null, nextType === 'carry' ? nextCol.ovalValue : nextCol.expectedResult, () => nextStepStd(idx, nextCol.colIdx, nextType));
  } else {
      exercises.value[idx].completed = true; 
      activeCell.value = null; 
      
      if (idx === exercises.value.length - 1) { 
          showConfetti.value = true; 
      } else {
          setTimeout(() => {
              activeExerciseIndex.value++;
              nextTick(autoFocus);
          }, 1500);
      }
    }
};

const fullReset = async () => {
  showConfetti.value = false; activeExerciseIndex.value = 0; exercises.value = Array.from({ length: 5 }, (_, i) => generateRandomExercise(i)); showSolution.value = false; await nextTick(); autoFocus(); 
};

onMounted(autoFocus);
</script>

<template>
  <div class="h-[100dvh] w-full bg-slate-100 flex justify-center overflow-hidden font-sans select-none">
    
    <SimpleConfetti :isActive="showConfetti" />
    
    <div class="w-full max-w-xl h-full flex flex-col bg-white shadow-2xl relative">

        <div v-if="showSolution" class="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" @click.self="showSolution = false">
            <div class="bg-white rounded-2xl shadow-2xl w-[90%] max-w-xs border-4 border-indigo-100 overflow-hidden flex flex-col max-h-[80vh]">
                <div class="bg-indigo-50 p-3 border-b border-indigo-100 flex justify-between items-center text-slate-700 font-black shrink-0">
                    <div class="flex items-center gap-2"><HelpCircle :size="20" class="text-indigo-500"/> Soluciones</div>
                    <button @click="showSolution = false" class="p-1 bg-white rounded-full text-slate-400 hover:text-red-500 transition shadow-sm"><CloseIcon :size="20" /></button>
                </div>
                <div class="p-2 bg-white border-b border-slate-100 shrink-0">
                    <div class="relative">
                        <select v-model="selectedTableMode" class="w-full p-2.5 pl-4 pr-10 bg-slate-50 border-2 border-indigo-100 text-slate-700 font-bold rounded-xl appearance-none focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer">
                            <option value="current">📝 Ver mis ejercicios actuales</option>
                            <option disabled>──────────</option>
                            <option v-for="n in 10" :key="n" :value="n">{{ operation === 'add' ? `➕ Tabla del ${n}` : (operation === 'sub' ? `➖ Tabla del ${n}` : `✖️ Tabla del ${n}`) }}</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-indigo-400"><ChevronDown :size="20" stroke-width="3" /></div>
                    </div>
                </div>
                <div class="overflow-y-auto p-3 bg-white scrollbar-thin">
                   <div class="grid grid-cols-1 gap-2">
                       <div v-for="item in displayedSolutions" :key="item.id" class="flex justify-between items-center p-2 rounded-xl border shadow-sm transition-all" :class="item.isCurrent ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50/50 border-indigo-100'">
                           <span class="text-lg font-bold text-slate-600 font-mono">{{ item.n1 }} <span class="text-indigo-400 mx-1">{{ item.op }}</span> {{ item.n2 }}</span>
                           <span class="text-xl font-black text-indigo-600">= {{ item.result }}</span>
                       </div>
                   </div>
                </div>
                <div class="p-3 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                    <button @click="showSolution = false" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition">¡Entendido!</button>
                </div>
            </div>
        </div>
        
        <div class="flex-none pt-2 px-4 pb-1 z-10 bg-white/90 backdrop-blur border-b border-slate-200 flex flex-col gap-1 md:gap-2">
            <div class="flex justify-between items-center h-10 md:h-14">
                <div class="flex items-center gap-3">
                    <button @click="$emit('back')" class="p-1.5 md:p-2.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs md:text-sm flex items-center gap-1 active:scale-95 transition"><ChevronLeft class="w-4 h-4 md:w-5 md:h-5"/> Volver</button>
                    
                    <div :class="`flex items-center gap-2 px-3 py-1 rounded-xl border-2 ${themeColors.bg} ${themeColors.border} shadow-sm`">
                         <div :class="`p-1 rounded-md ${themeColors.iconBg} flex items-center justify-center`">
                            <component :is="operationConfig.icon" class="text-white w-3 h-3 md:w-4 md:h-4" stroke-width="4" />
                         </div>
                         <span :class="`font-black text-xs md:text-sm uppercase ${themeColors.text}`">Nivel 1</span>
                    </div>

                </div>
                <div class="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Ej {{ activeExerciseIndex + 1 }} / 5</div>
                <div class="flex gap-2">
                   <button @click="fullReset" class="p-2 md:p-2.5 bg-white shadow-sm rounded-lg text-slate-500 active:scale-95 transition hover:text-indigo-600" title="Reiniciar"><Eraser class="w-4 h-4 md:w-5 md:h-5" /></button>
                   <button @click="showSolution = !showSolution" :class="`p-2 md:p-2.5 rounded-lg shadow-sm transition active:scale-95 ${showSolution ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-300' : 'bg-white text-slate-500 hover:text-indigo-600'}`"><component :is="showSolution ? EyeOff : Eye" class="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
            </div>
            
            <div class="w-full mb-1 z-30">
                <div class="bg-white/90 backdrop-blur-sm border-l-4 border-blue-500 rounded-r-xl p-3 shadow-md flex gap-3 items-center animate-fade-in">
                    <div class="text-2xl select-none">🦉</div>
                    <p class="text-slate-700 font-bold text-sm md:text-base leading-tight">
                        {{ owlAdvice }}
                    </p>
                </div>
            </div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center p-0 relative bg-slate-50 overflow-hidden">
            <div v-if="currentExercise" :key="currentExercise.id" class="w-[98%] max-w-lg flex flex-col justify-center h-full animate-fade-in">
                 
                 <div class="relative p-4 md:p-10 rounded-[2.5rem] border-4 w-full h-[95%] shadow-2xl flex flex-col justify-center items-center transition-all duration-500" 
                      :class="currentExercise.completed ? 'bg-green-100 border-green-400' : 'bg-[#fff9c4] border-yellow-400'"
                      style="background-image: linear-gradient(#e1f5fe 1px, transparent 1px); background-size: 100% 2.1rem;">
                    
                    <div v-if="currentExercise.completed" class="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-fade-in-scale">
                        <Check class="w-48 h-48 md:w-64 md:h-64 text-green-500/40" stroke-width="4" />
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
                                    <div class="h-14 md:h-20 flex items-end justify-center w-full mb-1">
                                        <div v-if="col.showOval" 
                                          :class="[ 'flex items-center justify-center cursor-pointer w-10 h-8 md:w-16 md:h-10 rounded-lg border-2 text-xl md:text-2xl font-bold shadow-inner transition-all z-10', 
                                                   currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-carry`] === 'correct' ? 'bg-green-100 border-green-500 text-green-700' : 
                                                   currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-carry`] === 'error' ? 'bg-red-50 border-red-500 text-red-600 animate-shake' : 
                                                   (activeCell?.exIdx === activeExerciseIndex && activeCell?.colIdx === col.colIdx && activeCell?.type === 'carry') ? 'bg-yellow-50 focus-neon' : 'bg-white border-slate-300' ]"
                                          @click="handleFocus(activeExerciseIndex, 'carry', col.colIdx, null, col.ovalValue, () => nextStepStd(activeExerciseIndex, col.colIdx, 'carry'))">
                                            {{ currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-carry`] === 'correct' ? col.ovalValue : (currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-carry_val`] || '') }}
                                        </div>
                                    </div>

                                    <div class="w-14 md:w-[4.5rem] h-16 md:h-20 flex items-center justify-center text-5xl md:text-6xl font-mono font-bold text-slate-700">
                                        {{ col.isTopVisible ? col.top : '' }}
                                    </div>
                                    
                                    <div class="w-14 md:w-[4.5rem] h-16 md:h-20 flex items-center justify-center text-5xl md:text-6xl font-mono font-bold text-slate-700 border-b-[4px] md:border-b-[6px] border-slate-800">
                                        {{ col.isBotVisible ? (props.operation === 'mult' ? col.fullBot : col.bot) : '' }}
                                    </div>

                                    <div :class="[ 'flex items-center justify-center cursor-pointer w-14 h-16 md:w-[4.5rem] md:h-24 rounded-xl md:rounded-2xl border-2 text-5xl md:text-6xl mt-2 md:mt-4 shadow-inner transition-all', 
                                                   currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-result`] === 'correct' ? 'bg-green-100 border-green-500 text-green-700' : 
                                                   currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-result`] === 'error' ? 'bg-red-50 border-red-500 text-red-600 animate-shake' : 
                                                   (activeCell?.exIdx === activeExerciseIndex && activeCell?.colIdx === col.colIdx && activeCell?.type === 'result') ? 'bg-yellow-50 focus-neon' : 'bg-white border-slate-300' ]"
                                      @click="handleFocus(activeExerciseIndex, 'result', col.colIdx, null, col.expectedResult, () => nextStepStd(activeExerciseIndex, col.colIdx, 'result'))">
                                        {{ currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-result`] === 'correct' ? col.expectedResult : (currentExercise.inputs[`in-${activeExerciseIndex}-c${col.colIdx}-result_val`] || '') }}
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

/* ANIMACIÓN DEL CHECK TRASLUCIDO */
.animate-fade-in-scale { animation: fadeInScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes fadeInScale { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

.scrollbar-thin::-webkit-scrollbar { width: 6px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 20px; }

/* EFECTO NEÓN PULSANTE */
.focus-neon { 
  border-color: #FACC15 !important; 
  border-width: 3px !important; 
  box-shadow: 0 0 15px rgba(250, 204, 21, 0.5); 
  animation: neon-pulse 1.5s infinite ease-in-out; 
  z-index: 50 !important; 
  transform: scale(1.05);
}

@keyframes neon-pulse {
  0% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.4); border-color: #eab308; }
  50% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.7); border-color: #facc15; }
  100% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.4); border-color: #eab308; }
}
</style>