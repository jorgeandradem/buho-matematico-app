<script setup>
/** * ARCHIVO: DecimalMult.vue
 * ESTADO: VERSIÓN MOTOR FINAL (V31 - DESFASE CORREGIDO Y PEDAGOGÍA EXACTA)
 * LÓGICA: Sincronización de anchos de cuadrícula (min-w) para evitar desfase. Textos dinámicos exactos.
 */
import { ref, computed, onMounted } from 'vue';
import { X as CloseIcon, Check, RotateCcw } from 'lucide-vue-next';
import DecimalKeypad from './DecimalKeypad.vue';

const emit = defineEmits(['close']);

const exercises = ref([]);
const currentExIdx = ref(0);
const isTransitioning = ref(false);
const showRewardModal = ref(false); 
const errorCol = ref(null);
let errorTimeout = null; 
const staircaseCells = ref(new Set()); 

const tasks = ref([]);
const currentTaskIdx = ref(0);
const userInputs = ref({}); 

const currentTask = computed(() => tasks.value[currentTaskIdx.value]);
const currentMsg = computed(() => currentTask.value?.msg || '¡A multiplicar!');

const generateBatch = () => {
    let batch = [];
    for(let i = 0; i < 3; i++) {
        const tInt = Math.floor(Math.random() * 999) + 1; 
        const tDec = Math.floor(Math.random() * 90) + 10; 
        const bInt = Math.floor(Math.random() * 99) + 1;
        const isOneDec = Math.random() > 0.5;
        const bDec = isOneDec ? Math.floor(Math.random() * 9) + 1 : Math.floor(Math.random() * 90) + 10;
        
        batch.push({ 
            tStr: `${tInt}${tDec}`, tDec: 2, 
            bStr: `${bInt}${bDec}`, bDec: isOneDec ? 1 : 2 
        });
    }
    exercises.value = batch;
    currentExIdx.value = 0;
    setupExercise();
};

const setupExercise = () => {
    userInputs.value = {};
    currentTaskIdx.value = 0;
    isTransitioning.value = false;
    errorCol.value = null;
    staircaseCells.value.clear();
    buildTaskQueue();
};

const getCol = (p) => p < 4 ? 12 - p : 11 - p;

// --- CEREBRO PEDAGÓGICO DE SECUENCIA EXACTA ---
const buildTaskQueue = () => {
    const ex = currentEx.value;
    const tArr = ex.tStr.split('').reverse();
    const bArr = ex.bStr.split('').reverse();
    const dTotal = ex.tDec + ex.bDec;
    const shiftProd = 4 - dTotal; 
    
    let q = [];
    let rowSums = []; 
    
    bArr.forEach((bDigitStr, i) => {
        const bDigit = Number(bDigitStr);
        let carry = 0;
        let rowValStr = "";
        
        for(let p = 0; p < shiftProd + i; p++) {
            staircaseCells.value.add(`r${i}-${getCol(p)}`);
        }
        
        // 1. Colocación de los ceros de alineación (Escalera)
        for(let z = 0; z < i; z++) {
            let p = z + shiftProd;
            let col = getCol(p);
            q.push({
                id: `r${i}-${col}`, expected: '0', 
                msg: `<b>Regla de valor:</b> Al iniciar la nueva fila deja un espacio en blanco tipo escalera. Escribe <b><span class="text-red-600">0</span></b> para desplazar.`, 
                type: 'zero', row: i, col
            });
            rowValStr = "0" + rowValStr;
        }
        
        // 2. Multiplicación paso a paso (SIN PARAR)
        tArr.forEach((tDigitStr, j) => {
            const tDigit = Number(tDigitStr);
            const prodWithoutCarry = bDigit * tDigit;
            const prod = prodWithoutCarry + carry;
            const res = prod % 10;
            const nextCarry = Math.floor(prod / 10);
            
            let p = i + j + shiftProd;
            let col = getCol(p);
            let currentTCol = getCol(j + (4 - ex.tDec));
            let currentBCol = getCol(i + (4 - ex.bDec));
            
            let posContext = '';
            if (i === 0 && j === 0) {
                posContext = `<b>Inicio:</b> Contamos los decimales del multiplicando y multiplicador = <b>${dTotal}</b>. Comenzamos en la casilla ${dTotal} contadas de derecha a izquierda. `;
            } else if (j === 0) {
                posContext = `<b>Inicio:</b> `;
            }

            let carryInstruction = (nextCarry > 0) ? ` y lleva <b><span class="text-red-600">${nextCarry}</span></b> a la casilla siguiente` : '';
            if (nextCarry > 0 && j === tArr.length - 1) {
                carryInstruction = ` y lleva <b><span class="text-red-600">${nextCarry}</span></b>`;
            }

            let msgText = '';
            if (carry > 0) {
                msgText = `${posContext}Multiplica <b><span class="text-red-600">${bDigit}</span></b> x <b><span class="text-red-600">${tDigit}</span></b> = ${prodWithoutCarry} + <b><span class="text-red-600">${carry}</span></b> (llevada) <b>= <span class="text-red-600">${prod}</span></b>. Escribe <b><span class="text-red-600">${res}</span></b>${carryInstruction}.`;
            } else {
                let verbWrite = (i === 0 && j === 0) ? `Escribe el <b><span class="text-red-600">${res}</span></b>` : `Escribe <b><span class="text-red-600">${res}</span></b>`;
                msgText = `${posContext}Multiplica <b><span class="text-red-600">${bDigit}</span></b> x <b><span class="text-red-600">${tDigit}</span></b> <b>= <span class="text-red-600">${prod}</span></b>. ${verbWrite}${carryInstruction}.`;
            }

            q.push({
                id: `r${i}-${col}`, expected: res.toString(), 
                msg: msgText, 
                type: 'res', row: i, col,
                tCol: currentTCol,
                bCol: currentBCol,
                sourceCarryCol: carry > 0 ? currentTCol : null
            });

            // 3. Escribir la llevada
            if (nextCarry > 0) {
                let cCol = getCol(j + 1 + (4 - ex.tDec));
                q.push({
                    id: `c${i}-${cCol}`, expected: nextCarry.toString(), 
                    msg: `Escribe el <b><span class="text-red-600">${nextCarry}</span></b> que llevas en la parte superior para no perder la secuencia.`, 
                    type: 'carry', row: i, col: cCol
                });
            }
            
            rowValStr = res.toString() + rowValStr;
            carry = nextCarry;
        });
        
        // 4. Acarreo final de la fila
        if (carry > 0) {
            let p = i + tArr.length + shiftProd;
            let col = getCol(p);
            q.push({
                id: `r${i}-${col}`, expected: carry.toString(), 
                msg: `Finalmente, baja el <b><span class="text-red-600">${carry}</span></b> que llevabas a esta casilla para completar la fila.`, 
                type: 'res', row: i, col
            });
            rowValStr = carry.toString() + rowValStr;
        }
        
        rowSums.push({ val: rowValStr });
    });
    
    // Configuración de las celdas grises
    for (let p = 0; p < shiftProd; p++) {
        staircaseCells.value.add(`sum-${getCol(p)}`);
    }

    // 5. Lógica de Suma de las filas obtenidas
    let maxLen = Math.max(...rowSums.map(r => r.val.length));
    let sumCarry = 0;
    
    for(let pRel = 0; pRel < maxLen || sumCarry > 0; pRel++) {
        let colSum = sumCarry;
        let hasVal = false;
        let addends = []; 
        
        rowSums.forEach(r => {
            if (pRel < r.val.length) {
                let digit = Number(r.val[r.val.length - 1 - pRel]);
                colSum += digit;
                addends.push(`<b><span class="text-red-600">${digit}</span></b>`);
                hasVal = true;
            }
        });
        
        if (!hasVal && sumCarry === 0) break;
        
        let p = pRel + shiftProd;
        let col = getCol(p);

        if (sumCarry > 0) {
            addends.push(`<b><span class="text-red-600">${sumCarry}</span></b> (llevada)`);
        }
        
        let res = colSum % 10;
        let nextSumCarry = Math.floor(colSum / 10);
        
        let msgText = '';
        if (addends.length > 1) {
            msgText = `<b>Fase de Suma:</b> Suma la columna: ${addends.join(' + ')} = <b><span class="text-red-600">${colSum}</span></b>. Escribe <b><span class="text-red-600">${res}</span></b> abajo${nextSumCarry > 0 ? ` y lleva <b><span class="text-red-600">${nextSumCarry}</span></b> a la casilla siguiente` : ''}.`;
        } else if (addends.length === 1 && sumCarry > 0 && !hasVal) {
             msgText = `Baja el <b><span class="text-red-600">${sumCarry}</span></b> de la llevada final a esta casilla para terminar la suma.`;
        } else {
             msgText = `Baja el <b><span class="text-red-600">${res}</span></b>, ya que no hay con qué sumar en esta posición.`;
        }
        
        q.push({
            id: `sum-${col}`, expected: res.toString(), 
            msg: msgText, 
            type: 'sum', row: 'sum', col,
            sourceCarryCol: sumCarry > 0 ? col : null
        });

        if(nextSumCarry > 0) {
           q.push({
                id: `csum-${getCol(p+1)}`, expected: nextSumCarry.toString(), 
                msg: `Escribe el <b><span class="text-red-600">${nextSumCarry}</span></b> que llevas en la parte superior para continuar la suma.`, 
                type: 'carry', row: 'sum', col: getCol(p+1)
            }); 
        }
        
        sumCarry = nextSumCarry;
    }
    
    tasks.value = q;
};

const handleKeypress = (key) => {
    if (isTransitioning.value || showRewardModal.value || !currentTask.value) return;

    const inputStr = key.toString();

    if (inputStr === currentTask.value.expected) {
        userInputs.value[currentTask.value.id] = inputStr;
        currentTaskIdx.value++;
        
        errorCol.value = null;
        if (errorTimeout) clearTimeout(errorTimeout);
        
        if (currentTaskIdx.value >= tasks.value.length) completeExercise();
    } else {
        errorCol.value = currentTask.value.id;
        if (navigator.vibrate) navigator.vibrate(200);
        
        try { new Audio('/audios/wrong.mp3').play(); } catch(e){}
        
        if (errorTimeout) clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => { errorCol.value = null; }, 500); 
    }
};

const completeExercise = () => {
    isTransitioning.value = true;
    
    try { new Audio('/audios/success.mp3').play(); } catch(e){}
    
    setTimeout(() => {
        if (currentExIdx.value < exercises.value.length - 1) {
            currentExIdx.value++;
            setupExercise();
        } else {
            showRewardModal.value = true;
            try { new Audio('/audios/win-jingle-soft.mp3').play(); } catch(e){}
        }
    }, 2500);
};

const restartGame = () => {
    showRewardModal.value = false;
    generateBatch();
};

const currentEx = computed(() => exercises.value[currentExIdx.value]);
const numRows = computed(() => currentEx.value ? 2 + currentEx.value.bStr.length + 1 : 0);

const getStaticCell = (rowIdx, col) => {
    const ex = currentEx.value;
    if (!ex || col === 8) return '';
    
    if (rowIdx === 0) { 
        let strIdx = (col > 8 ? 12 - col : 11 - col) - (4 - ex.tDec);
        return (strIdx >= 0 && strIdx < ex.tStr.length) ? ex.tStr[ex.tStr.length - 1 - strIdx] : '';
    }
    if (rowIdx === 1) {
        if (col === 1) return ''; 
        let strIdx = (col > 8 ? 12 - col : 11 - col) - (4 - ex.bDec);
        return (strIdx >= 0 && strIdx < ex.bStr.length) ? ex.bStr[ex.bStr.length - 1 - strIdx] : '';
    }
    return '';
};

const getUserInput = (rowIdx, col) => {
    if (rowIdx >= 2 && rowIdx < numRows.value - 1) return userInputs.value[`r${rowIdx - 2}-${col}`] || '';
    if (rowIdx === numRows.value - 1) return userInputs.value[`sum-${col}`] || '';
    return '';
};

const isActiveTask = (rowIdx, col) => {
    if (!currentTask.value) return false;
    
    const task = currentTask.value;

    if (task.type === 'carry') {
        return rowIdx === -1 && task.col === col;
    }
    if (task.type === 'sum') {
        return rowIdx === numRows.value - 1 && task.col === col;
    }
    if (task.type === 'res' || task.type === 'zero') {
        return task.row === rowIdx - 2 && task.col === col;
    }

    return false;
};

const getCellId = (rowIdx, col) => {
    if (rowIdx >= 2 && rowIdx < numRows.value - 1) return `r${rowIdx - 2}-${col}`;
    if (rowIdx === numRows.value - 1) return `sum-${col}`;
    return null;
};

onMounted(() => {
    generateBatch();
    window.addEventListener('keydown', (e) => {
        if(/[0-9]/.test(e.key)) handleKeypress(e.key);
    });
});
</script>

<template>
  <div class="w-full h-full flex flex-col bg-slate-50 overflow-hidden animate-fade-in relative">
    
    <div v-if="showRewardModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform scale-100 transition-all">
            <div class="text-7xl mb-4 animate-bounce-soft">🦉🏆</div>
            <h2 class="text-2xl font-black text-slate-800 mb-2">¡Misión Cumplida!</h2>
            <p class="text-slate-600 mb-8 font-medium">Has dominado los 3 ejercicios de multiplicación decimal.</p>
            
            <div class="flex flex-col gap-3 w-full">
                <button @click="restartGame" class="w-full py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold rounded-xl shadow-sm transition-colors text-lg flex justify-center items-center gap-2">
                    <RotateCcw :size="20" /> Volver a jugar
                </button>
                <button @click="emit('close')" class="w-full py-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
                    <CloseIcon :size="20" /> Salir al Lobby
                </button>
            </div>
        </div>
    </div>

    <header class="flex items-center justify-between px-4 py-2 border-b border-slate-200 shrink-0 bg-white z-20 shadow-sm">
        <div class="flex items-center gap-3 w-full pr-4">
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-sm border-2 border-purple-200 shrink-0">🦉</div>
            <div :class="['border-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 flex-1 transition-all duration-300 shadow-sm', isTransitioning ? 'bg-green-100 border-green-300' : 'bg-yellow-50 border-yellow-300']">
                <p class="font-medium text-[12px] sm:text-[14px] leading-snug" :class="isTransitioning ? 'text-green-800 font-bold' : 'text-slate-700'">
                    <span v-if="isTransitioning">¡Excelente trabajo! Preparando el siguiente...</span>
                    <span v-else v-html="currentMsg"></span>
                </p>
            </div>
        </div>
        <div class="flex gap-2 shrink-0">
            <div class="px-4 py-1.5 bg-slate-100 rounded-full text-slate-600 font-bold text-sm flex items-center border border-slate-200">
                {{ currentExIdx + 1 }} / 3
            </div>
            <button @click="emit('close')" class="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                <CloseIcon :size="18" />
            </button>
        </div>
    </header>

    <main class="flex-1 w-full p-2 sm:p-4 overflow-hidden flex flex-col items-center justify-center">
        <div class="w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-md relative">
            
            <div class="grid grid-cols-12 gap-0 mb-1 w-full z-10">
                <div v-for="c in 12" :key="'carry-'+c" class="h-6 flex items-center justify-center text-[11px] sm:text-xs font-black text-yellow-600 relative w-full min-w-[22px] sm:min-w-[30px]">
                    
                    <div v-if="isActiveTask(-1, c)" class="absolute w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full animate-pulse border border-yellow-400"></div>
                    
                    <Check v-if="currentTask?.sourceCarryCol === c" :size="14" stroke-width="5" class="text-green-500 absolute -top-1 right-0 bg-white/90 rounded-full shadow-sm z-20 animate-bounce-soft" />

                    <div v-if="errorCol && (errorCol === `c${currentTask?.row}-${c}` || errorCol === `csum-${c}`)" class="absolute w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full animate-shake border border-red-500"></div>
                    
                    <span class="z-10">{{ userInputs[`c${currentTask?.row}-${c}`] || userInputs[`csum-${c}`] || '' }}</span>
                </div>
            </div>

            <div class="relative grid grid-cols-12 gap-0 border-t border-l border-slate-300 w-full transition-colors duration-500 rounded-sm overflow-hidden" 
                 :class="isTransitioning ? 'bg-green-50 border-green-300' : 'bg-white'"
                 v-if="numRows > 0">
                 
                 <div v-if="isTransitioning" class="absolute inset-0 z-50 flex items-center justify-center bg-green-100/40 backdrop-blur-[2px]">
                     <div class="bg-white rounded-full p-4 sm:p-6 shadow-xl animate-bounce-soft border-4 border-green-400">
                         <Check :size="60" stroke-width="4" class="text-green-500" />
                     </div>
                 </div>

                <template v-for="r in numRows" :key="'row-'+r">
                    <div v-for="c in 12" :key="'cell-'+r+'-'+c"
                         class="w-full min-w-[22px] sm:min-w-[30px] h-10 sm:h-12 border-b border-r border-slate-300 flex items-center justify-center font-mono text-xl sm:text-2xl relative transition-all duration-200"
                         :class="{
                             'bg-white': r <= 2 && !isTransitioning,
                             'border-b-2 border-b-slate-800': r === 2 || r === numRows - 1
                         }">
                         
                         <div v-if="staircaseCells.has(getCellId(r-1, c)) && !isTransitioning" class="absolute inset-0 bg-slate-300 border border-slate-400/60 z-0 shadow-inner"></div>

                         <div v-if="isActiveTask(r-1, c) && !isTransitioning" class="absolute inset-0 bg-yellow-50 ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse z-10"></div>
                         
                         <div v-if="errorCol && errorCol === getCellId(r-1, c)" class="absolute inset-0 bg-red-50 ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-shake z-10"></div>

                         <span v-if="c === 8" class="text-slate-800 font-bold relative z-20">,</span>
                         <span v-else-if="r === 2 && c === 1" class="text-slate-800 font-bold mr-1 relative z-20">x</span>
                         
                         <span v-else-if="r <= 2" class="text-slate-800 relative z-20 flex items-center justify-center w-full h-full">
                             {{ getStaticCell(r-1, c) }}
                             <Check v-if="r === 1 && currentTask?.tCol === c && !isTransitioning" :size="12" stroke-width="5" class="text-green-500 absolute top-0.5 right-0.5 bg-white/80 rounded-full" />
                             <Check v-if="r === 2 && currentTask?.bCol === c && !isTransitioning" :size="12" stroke-width="5" class="text-green-500 absolute bottom-0.5 right-0.5 bg-white/80 rounded-full" />
                         </span>
                         
                         <span v-else class="text-slate-800 font-medium z-20">{{ getUserInput(r-1, c) }}</span>
                    </div>
                </template>
            </div>

        </div>
    </main>

    <footer class="shrink-0 w-full bg-slate-50 border-t border-slate-200 pb-6 pt-2">
        <DecimalKeypad @press="handleKeypress" />
    </footer>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }

.animate-bounce-soft { animation: bounceSoft 1s infinite; }
@keyframes bounceSoft { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }
</style>