<script setup>
/**
 * ARCHIVO: DecimalMultBasic.vue - BUILD V5.5.0 (VERSIÓN MAESTRA)
 * FIX: Auto-Piloto en Escaleras. Los ceros se rellenan automáticamente con delay visual.
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { ChevronLeft, HelpCircle, ArrowRight, CheckCircle2, BookOpen, Check, Star, Trophy, RotateCcw } from 'lucide-vue-next';
import DecimalKeypad from './DecimalKeypad.vue';

const emit = defineEmits(['close', 'next-phase']);

// ==========================================
// ESTADO GLOBAL DEL MÓDULO, RONDAS Y EJERCICIO
// ==========================================
const currentPhase = ref('phase1'); 
const scrollContainer = ref(null); 
const recoverCommaBtnRef = ref(null); 

const currentRound = ref(1);
const maxRounds = 2;
const showRewardModal = ref(false);

const exercise = ref({
    factorA: '', factorB: '',
    decA: 0, decB: 0, decTotal: 0,
    tStr: '', bStr: '',
    finalTotal: ''
});

const finalNumberArray = ref([]);

// ==========================================
// GENERADOR ALEATORIO (REGLAS ESTRICTAS)
// ==========================================
const generateExercise = () => {
    const randomStr = (len) => {
        let res = '';
        for(let i=0; i<len; i++) {
            if(i===0) res += Math.floor(Math.random() * 9) + 1; 
            else res += Math.floor(Math.random() * 10);
        }
        return res;
    };

    const intA_len = Math.random() > 0.5 ? 1 : 2;
    const decA_len = Math.random() > 0.5 ? 1 : 2;
    const intB_len = 1;
    const decB_len = Math.random() > 0.5 ? 1 : 2;

    const intA = randomStr(intA_len);
    const decA = randomStr(decA_len);
    const intB = randomStr(intB_len);
    const decB = randomStr(decB_len);

    const factorA = `${intA},${decA}`;
    const factorB = `${intB},${decB}`;
    const tStr = `${intA}${decA}`;
    const bStr = `${intB}${decB}`;

    const totalNum = BigInt(tStr) * BigInt(bStr);
    const finalTotal = totalNum.toString();

    exercise.value = {
        factorA, factorB,
        decA: decA_len, decB: decB_len,
        decTotal: decA_len + decB_len,
        tStr, bStr, finalTotal
    };

    currentPhase.value = 'phase1';
    p1Step.value = 'intro';
    p1Inputs.value = { countA: '', countB: '', total: '' };
    errorActive.value = false;
    p3Step.value = 'intro';

    buildPhase3Array();
    
    nextTick(() => {
        if(scrollContainer.value) scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

const buildPhase3Array = () => {
    const arr = [];
    const str = exercise.value.finalTotal;
    for(let i=0; i<str.length; i++) {
        arr.push({ id: `d${i}`, val: str[i] });
    }
    arr.push({ id: 'comma', val: ',' }); 
    finalNumberArray.value = arr;
};

// ==========================================
// LÓGICA: FASE 1 (CONTEO DECIMAL)
// ==========================================
const p1Step = ref('intro'); 
const p1Inputs = ref({ countA: '', countB: '', total: '' });
const errorActive = ref(false);

const factorA_parts = computed(() => exercise.value.factorA.split(','));
const factorB_parts = computed(() => exercise.value.factorB.split(','));

const triggerError = () => {
    errorActive.value = true;
    if (navigator.vibrate) navigator.vibrate(200);
    try { new Audio('/audios/wrong.mp3').play(); } catch(e){}
    setTimeout(() => errorActive.value = false, 800);
};

const playTapSound = () => {
    try { 
        const tap = new Audio('/audios/ui.mp3');
        tap.playbackRate = 0.95 + Math.random() * 0.1;
        tap.play(); 
    } catch(e){}
};

const getCellClassP1 = (stepTarget, val) => {
    if (val !== '') return 'bg-emerald-100 border-2 border-emerald-400 text-emerald-900 shadow-sm';
    if (p1Step.value === stepTarget) {
        if (errorActive.value) return 'bg-red-100 border-2 border-red-500 text-red-900 animate-shake-soft animate-glow-red';
        return 'bg-yellow-100 border-2 border-yellow-400 text-yellow-900 animate-glow-gold';
    }
    return 'bg-slate-100 border-2 border-transparent text-slate-400 shadow-inner';
};

const startPhase2 = () => {
    currentPhase.value = 'phase2';
    nextTick(() => {
        setupPhase2();
        if(scrollContainer.value) scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

// ==========================================
// LÓGICA: FASE 2 (CUADERNO EXPERTO)
// ==========================================
const p2Tasks = ref([]);
const p2TaskIdx = ref(0);
const p2Inputs = ref({}); 
const p2Complete = ref(false);
const errorCol = ref(null);
let errorTimeout = null; 
const staircaseCells = ref(new Set()); 

const currentTask = computed(() => p2Tasks.value[p2TaskIdx.value]);
const numRows = computed(() => 2 + exercise.value.bStr.length + 1);

watch(p2Complete, async (newVal) => {
    if (newVal) {
        await nextTick();
        setTimeout(() => {
            if (recoverCommaBtnRef.value) {
                recoverCommaBtnRef.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 150);
    }
});

// 🛠️ FIX MAESTRO: Auto-Piloto para ceros de la escalera
watch(currentTask, (newTask) => {
    if (currentPhase.value === 'phase2' && newTask && newTask.type === 'zero') {
        // Pausa de 750ms para que el alumno visualice el salto lógico
        setTimeout(() => {
            // Confirmamos que seguimos en la misma tarea
            if (currentTask.value === newTask) {
                p2Inputs.value[newTask.id] = '0';
                playTapSound();
                p2TaskIdx.value++;
                if (p2TaskIdx.value >= p2Tasks.value.length) {
                    p2Complete.value = true;
                }
            }
        }, 750); 
    }
}, { immediate: true });

const setupPhase2 = () => {
    p2Inputs.value = {};
    p2TaskIdx.value = 0;
    errorCol.value = null;
    p2Complete.value = false;
    staircaseCells.value.clear();
    buildTaskQueue();
};

const getCol = (p) => 12 - p;

const buildTaskQueue = () => {
    const ex = exercise.value;
    const tArr = ex.tStr.split('').reverse();
    const bArr = ex.bStr.split('').reverse();
    
    let q = [];
    let rowSums = []; 
    
    bArr.forEach((bDigitStr, i) => {
        const bDigit = Number(bDigitStr);
        let carry = 0;
        let rowValStr = "";
        
        for(let p = 0; p < i; p++) {
            staircaseCells.value.add(`r${i}-${getCol(p)}`);
        }
        
        for(let z = 0; z < i; z++) {
            let col = getCol(z);
            q.push({
                id: `r${i}-${col}`, expected: '0', 
                msg: `Fila ${i+1}: Colocamos un <b>0 automático</b> en la escalera para alinear.`, 
                type: 'zero', row: i, col
            });
            rowValStr = "0" + rowValStr;
        }
        
        tArr.forEach((tDigitStr, j) => {
            const tDigit = Number(tDigitStr);
            const prod = bDigit * tDigit + carry;
            const res = prod % 10;
            const nextCarry = Math.floor(prod / 10);
            
            let p = i + j;
            let col = getCol(p);
            let currentTCol = getCol(j);
            let currentBCol = getCol(i);
            
            let sumText = carry > 0 ? ` + ${carry}` : '';
            q.push({
                id: `r${i}-${col}`, expected: res.toString(), 
                msg: `Multiplica <b>${bDigit}</b> x <b>${tDigit}</b>${sumText} = <b>${prod}</b>. Escribe <b>${res}</b>.`, 
                type: 'res', row: i, col,
                tCol: currentTCol,
                bCol: currentBCol,
                sourceCarryCol: carry > 0 ? getCol(i + j) : null 
            });

            if (nextCarry > 0) {
                let cCol = getCol(i + j + 1); 
                q.push({
                    id: `c${i}-${cCol}`, expected: nextCarry.toString(), 
                    msg: `Llevas <b>${nextCarry}</b>. Anótalo arriba.`, 
                    type: 'carry', row: i, col: cCol
                });
            }
            rowValStr = res.toString() + rowValStr;
            carry = nextCarry;
        });
        
        if (carry > 0) {
            let p = i + tArr.length;
            let col = getCol(p);
            q.push({
                id: `r${i}-${col}`, expected: carry.toString(), 
                msg: `Baja la llevada final (<b>${carry}</b>) a esta línea.`, 
                type: 'res', row: i, col
            });
            rowValStr = carry.toString() + rowValStr;
        }
        rowSums.push({ val: rowValStr });
    });
    
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
                addends.push(`<b>${digit}</b>`);
                hasVal = true;
            }
        });
        
        if (!hasVal && sumCarry === 0) break;
        
        let col = getCol(pRel);
        if (sumCarry > 0) addends.push(`<b>${sumCarry}</b> (acarreo)`);
        
        let res = colSum % 10;
        let nextSumCarry = Math.floor(colSum / 10);
        
        let msgText = addends.length > 1 
            ? `Suma: ${addends.join(' + ')} = <b>${colSum}</b>. Escribe <b>${res}</b>.`
            : (hasVal ? `Baja el <b>${res}</b>.` : `Baja el acarreo <b>${sumCarry}</b>.`);
        
        q.push({
            id: `sum-${col}`, expected: res.toString(), 
            msg: msgText, 
            type: 'sum', row: 'sum', col,
            sourceCarryCol: sumCarry > 0 ? col : null
        });

        if(nextSumCarry > 0) {
           q.push({
                id: `csum-${getCol(pRel+1)}`, expected: nextSumCarry.toString(), 
                msg: `Llevas <b>${nextSumCarry}</b>. Anótalo arriba.`, 
                type: 'carry', row: 'sum', col: getCol(pRel+1)
            }); 
        }
        sumCarry = nextSumCarry;
    }
    p2Tasks.value = q;
};

const getStaticCell = (rowIdx, col) => {
    const ex = exercise.value;
    if (rowIdx === 0) { 
        let strIdx = 12 - col;
        return (strIdx >= 0 && strIdx < ex.tStr.length) ? ex.tStr[ex.tStr.length - 1 - strIdx] : '';
    }
    if (rowIdx === 1) {
        if (col === 1) return ''; 
        let strIdx = 12 - col;
        return (strIdx >= 0 && strIdx < ex.bStr.length) ? ex.bStr[ex.bStr.length - 1 - strIdx] : '';
    }
    return '';
};

const getUserInputP2 = (rowIdx, col) => {
    if (rowIdx >= 2 && rowIdx < numRows.value - 1) return p2Inputs.value[`r${rowIdx - 2}-${col}`] || '';
    if (rowIdx === numRows.value - 1) return p2Inputs.value[`sum-${col}`] || '';
    return '';
};

const isActiveTaskP2 = (rowIdx, col) => {
    if (!currentTask.value) return false;
    const task = currentTask.value;
    if (task.type === 'carry') return rowIdx === -1 && task.col === col;
    if (task.type === 'sum') return rowIdx === numRows.value - 1 && task.col === col;
    if (task.type === 'res' || task.type === 'zero') return task.row === rowIdx - 2 && task.col === col;
    return false;
};

const getCellId = (rowIdx, col) => {
    if (rowIdx >= 2 && rowIdx < numRows.value - 1) return `r${rowIdx - 2}-${col}`;
    if (rowIdx === numRows.value - 1) return `sum-${col}`;
    return null;
};

const startPhase3 = () => {
    currentPhase.value = 'phase3';
};

// ==========================================
// LÓGICA: FASE 3 (RECUPERAR LA COMA)
// ==========================================
const p3Step = ref('intro'); 

const triggerCommaAnimation = () => {
    if(p3Step.value === 'done') return;
    p3Step.value = 'done';
    try { new Audio('/audios/success.mp3').play(); } catch(e){}
    try { new Audio('/audios/win-jingle-soft.mp3').play(); } catch(e){}
    
    let arr = [...finalNumberArray.value];
    const commaIdx = arr.findIndex(item => item.id === 'comma');
    const commaItem = arr.splice(commaIdx, 1)[0];
    
    let insertPos = arr.length - exercise.value.decTotal;

    let zCount = 0;
    while(insertPos <= 0) {
        arr.unshift({ id: `z${zCount++}`, val: '0' });
        insertPos++;
    }

    arr.splice(insertPos, 0, commaItem);
    finalNumberArray.value = arr;
};

const proceedNextRound = () => {
    if (currentRound.value < maxRounds) {
        currentRound.value++;
        generateExercise();
    } else {
        showRewardModal.value = true;
        try { new Audio('/audios/win-jingle-soft.mp3').play(); } catch(e){}
    }
};

const restartSystem = () => {
    showRewardModal.value = false;
    currentRound.value = 1;
    generateExercise();
};

// ==========================================
// MENSAJES Y TECLADO MAESTRO
// ==========================================
const owlMessage = computed(() => {
    const ex = exercise.value;
    if (currentPhase.value === 'phase1') {
        const msgs = {
            intro: `Para multiplicar con decimales, primero debemos saber cuántos espacios ocupan después de la coma.`,
            count_a: `Mira el <b>${ex.factorA}</b>. Cuenta los números tras la coma y escríbelo en la casilla.`,
            count_b: `Ahora mira el <b>${ex.factorB}</b>. ¿Cuántos lugares ocupa tras la coma? Escríbelo.`,
            sum_total: `¡Excelente! Sumemos <b>${ex.decA} + ${ex.decB}</b>. Este es el total de saltos que daremos al final.`,
            complete: `Guarda ese <b>${ex.decTotal}</b> en memoria. Ya podemos quitar las comas para operar.`,
            remove_commas: `¡Mira la magia! Sin las comas, los números se convierten en <b>${ex.tStr}</b> y <b>${ex.bStr}</b>.`
        };
        return msgs[p1Step.value];
    } 
    else if (currentPhase.value === 'phase2') {
        if (p2Complete.value) return `¡Magnífico! Hemos resuelto <b>${ex.tStr} x ${ex.bStr} = ${ex.finalTotal}</b>. Recuperemos la coma original.`;
        return currentTask.value?.msg || '¡A multiplicar en el cuaderno!';
    } 
    else {
        if (p3Step.value === 'done') return `¡Bien hecho! Hemos terminado la ronda ${currentRound.value} con éxito.`;
        return `Recordemos: Daremos <b>${ex.decTotal}</b> saltos decimales desde la derecha. Pulsa la <b>Coma (,)</b>.`;
    }
});

const handleKeypress = (key) => {
    const inputStr = String(key);

    if (currentPhase.value === 'phase1') {
        if (errorActive.value || p1Step.value === 'intro' || p1Step.value === 'complete' || p1Step.value === 'remove_commas') return;
        let isCorrect = false;
        if (p1Step.value === 'count_a' && inputStr === String(exercise.value.decA)) { p1Inputs.value.countA = inputStr; p1Step.value = 'count_b'; isCorrect = true; }
        else if (p1Step.value === 'count_b' && inputStr === String(exercise.value.decB)) { p1Inputs.value.countB = inputStr; p1Step.value = 'sum_total'; isCorrect = true; }
        else if (p1Step.value === 'sum_total' && inputStr === String(exercise.value.decTotal)) { p1Inputs.value.total = inputStr; p1Step.value = 'complete'; isCorrect = true; }
        
        if (!isCorrect) {
            triggerError();
        } else {
            playTapSound(); 
        }
    } 
    else if (currentPhase.value === 'phase2') {
        if (p2Complete.value || !currentTask.value) return;

        // 🛠️ FIX MAESTRO: Si la tarea actual es rellenar un cero, bloqueamos el teclado manual. El sistema lo hará solo.
        if (currentTask.value.type === 'zero') return;

        if (inputStr === currentTask.value.expected) {
            p2Inputs.value[currentTask.value.id] = inputStr;
            p2TaskIdx.value++;
            errorCol.value = null;
            if (errorTimeout) clearTimeout(errorTimeout);
            
            playTapSound(); 

            if (p2TaskIdx.value >= p2Tasks.value.length) {
                p2Complete.value = true;
            }
        } else {
            errorCol.value = currentTask.value.id;
            if (errorTimeout) clearTimeout(errorTimeout);
            triggerError();
            errorTimeout = setTimeout(() => { errorCol.value = null; }, 600); 
        }
    }
    else if (currentPhase.value === 'phase3') {
        if (p3Step.value === 'done') return;
        if (inputStr === ',') triggerCommaAnimation();
        else triggerError();
    }
};

onMounted(() => {
    generateExercise();
});
</script>

<template>
  <div class="master-container font-primary">
    
    <div v-if="showRewardModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform scale-100 transition-all border-4 border-yellow-400">
            <div class="text-7xl mb-4 animate-bounce-soft relative">
                🏆
                <div class="absolute -top-4 -right-4 text-3xl animate-spin-slow">✨</div>
                <div class="absolute top-4 -left-6 text-2xl animate-pulse">🎉</div>
            </div>
            <h2 class="text-3xl font-black text-slate-800 mb-2 uppercase">¡Felicidades!</h2>
            <p class="text-slate-600 mb-8 font-medium text-lg">Has completado tu desafío con Búho Matemático.</p>
            
            <div class="flex flex-col gap-3 w-full">
                <button @click="restartSystem" class="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_6px_0_#059669] active:translate-y-1 active:shadow-none transition-all text-sm flex justify-center items-center gap-2">
                    <RotateCcw :size="20" stroke-width="3" /> OTRO DESAFÍO
                </button>
                <button @click="emit('close')" class="w-full py-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 font-bold uppercase tracking-widest rounded-2xl transition-colors text-xs mt-2">
                    SALIR AL LOBBY
                </button>
            </div>
        </div>
    </div>

    <div class="app-canvas flex flex-col h-full overflow-hidden">
        
        <div class="shrink-0 w-full z-40 bg-[#f8fafc] flex flex-col shadow-sm border-b border-slate-200">
            <header class="header-standard border-none shadow-none pb-0 px-2 pt-2">
                <button @click="emit('close')" class="flex items-center gap-1 font-black text-[11px] tracking-widest uppercase text-slate-500 active:scale-90 transition-all">
                    <ChevronLeft :size="20" stroke-width="4" /> VOLVER
                </button>
                <div class="game-title text-center" :class="{'text-indigo-800': currentPhase === 'phase2', 'text-emerald-700': currentPhase === 'phase3'}">
                    {{ currentPhase === 'phase1' ? 'MULTIPLICACIÓN DECIMAL' : (currentPhase === 'phase2' ? 'CUADERNO' : 'RESULTADO FINAL') }}
                </div>
                <div class="bg-slate-200 px-3 py-1 rounded-full text-xs font-black text-slate-500">
                    {{ currentRound }} / {{ maxRounds }}
                </div>
            </header>

            <div class="px-2 sm:px-8 pb-3 pt-2">
                <div class="rules-panel w-full max-w-[480px] mx-auto mb-0 shadow-sm transition-colors duration-500"
                     :class="{'bg-emerald-50 border-emerald-200': currentPhase === 'phase3' && p3Step === 'done'}">
                    <div class="rules-badge" :class="currentPhase === 'phase1' ? 'bg-indigo-600' : (currentPhase === 'phase2' ? 'bg-teal-600' : 'bg-emerald-600')">
                        {{ currentPhase === 'phase1' ? 'INSTRUCCIONES' : (currentPhase === 'phase2' ? 'PASO 2' : 'PASO FINAL') }}
                    </div>
                    <div class="flex items-center gap-3 min-h-[50px] mt-1">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border transition-colors"
                             :class="currentPhase === 'phase1' ? 'bg-indigo-50 border-indigo-100' : (currentPhase === 'phase2' ? 'bg-teal-50 border-teal-100' : 'bg-emerald-100 border-emerald-200')">🦉</div>
                        <p class="text-xs font-bold text-slate-700 leading-tight" v-html="owlMessage"></p>
                    </div>
                </div>
            </div>
        </div>

        <main ref="scrollContainer" class="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col items-center pt-3 pb-8 px-2 sm:px-8 scroll-smooth">
            <transition name="fade-slide" mode="out-in">
                
                <div v-if="currentPhase === 'phase1'" key="fase1" class="w-full flex flex-col items-center">
                    <div class="w-full max-w-sm rounded-3xl shadow-sm border-2 p-1.5 relative z-20 transition-colors duration-700"
                         :class="p1Step === 'remove_commas' ? 'bg-emerald-50 border-emerald-400 shadow-emerald-200 shadow-lg animate-glow-emerald' : 'bg-white border-slate-200'">
                        
                        <div class="flex items-center justify-between p-2 rounded-2xl transition-all">
                            <div class="flex flex-col pl-2">
                                <span class="text-[10px] font-black uppercase tracking-tighter" :class="p1Step === 'remove_commas' ? 'text-emerald-700' : 'text-teal-600'">Multiplicando</span>
                                <div class="text-2xl font-black italic flex items-baseline" :class="p1Step === 'remove_commas' ? 'text-emerald-900' : 'text-slate-700'">
                                    <span>{{ factorA_parts[0] }}</span>
                                    <span class="transition-all duration-1000 ease-in-out overflow-hidden"
                                          :class="p1Step === 'remove_commas' ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[10px]'">,</span>
                                    <span>{{ factorA_parts[1] }}</span>
                                </div>
                            </div>
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all relative z-30"
                                 :class="getCellClassP1('count_a', p1Inputs.countA)">
                                {{ p1Inputs.countA || (p1Step === 'count_a' ? '?' : '') }}
                            </div>
                        </div>

                        <div class="h-px w-[85%] mx-auto transition-all" :class="p1Step === 'remove_commas' ? 'bg-emerald-200' : 'bg-slate-100'"></div>

                        <div class="flex items-center justify-between p-2 rounded-2xl transition-all">
                            <div class="flex flex-col pl-2">
                                <span class="text-[10px] font-black uppercase tracking-tighter" :class="p1Step === 'remove_commas' ? 'text-emerald-700' : 'text-teal-600'">Multiplicador</span>
                                <div class="text-2xl font-black italic flex items-baseline" :class="p1Step === 'remove_commas' ? 'text-emerald-900' : 'text-slate-700'">
                                    <span>{{ factorB_parts[0] }}</span>
                                    <span class="transition-all duration-1000 ease-in-out overflow-hidden"
                                          :class="p1Step === 'remove_commas' ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[10px]'">,</span>
                                    <span>{{ factorB_parts[1] }}</span>
                                </div>
                            </div>
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all relative z-30"
                                 :class="getCellClassP1('count_b', p1Inputs.countB)">
                                {{ p1Inputs.countB || (p1Step === 'count_b' ? '?' : '') }}
                            </div>
                        </div>
                    </div>

                    <div class="w-full max-w-sm h-[88px] flex items-end justify-center mt-1">
                        <transition name="fade">
                            <div v-if="p1Step === 'sum_total' || p1Step === 'complete' || p1Step === 'remove_commas'" 
                                 class="w-full flex items-center justify-between px-4 py-2.5 bg-orange-500 text-white rounded-3xl shadow-xl border-b-[5px] border-orange-700/30 relative z-20"
                                 :class="{'opacity-80 scale-[0.98]': p1Step === 'remove_commas'}">
                                <div class="flex flex-col pl-2">
                                    <span class="text-[12px] font-black uppercase tracking-widest">Total Decimales</span>
                                    <span class="text-[11px] opacity-90 font-bold italic">Suma de posiciones 🐸</span>
                                </div>
                                <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg relative z-30 transition-all bg-white"
                                     :class="[
                                        p1Inputs.total ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-900' : 
                                        (errorActive ? 'bg-red-100 border-2 border-red-500 text-red-900 animate-shake-soft animate-glow-red' : 
                                        'bg-yellow-100 border-2 border-yellow-400 text-yellow-900 animate-glow-gold')
                                     ]">
                                    {{ p1Inputs.total || '?' }}
                                </div>
                            </div>
                        </transition>
                    </div>

                    <div class="w-full max-w-sm mt-4 mb-6 flex items-center justify-center relative z-20">
                        <transition name="fade" mode="out-in">
                            <button v-if="p1Step === 'intro'" @click="p1Step = 'count_a'" 
                                    class="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-black rounded-full shadow-[0_5px_0_#ca8a04] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs">
                                INICIAR CONTEO <ArrowRight :size="18" />
                            </button>
                            <button v-else-if="p1Step === 'complete'" @click="p1Step = 'remove_commas'" 
                                    class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-[0_5px_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs animate-pulse-soft">
                                CONTINUAR <CheckCircle2 :size="18" />
                            </button>
                            <button v-else-if="p1Step === 'remove_commas'" @click="startPhase2" 
                                    class="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-3xl shadow-[0_5px_0_#059669] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs animate-bounce-soft">
                                IR AL CUADERNO <BookOpen :size="18" />
                            </button>
                        </transition>
                    </div>
                </div>

                <div v-else-if="currentPhase === 'phase2'" key="fase2" class="w-full flex flex-col items-center">
                    <div class="w-full max-w-[480px] bg-white border-2 border-slate-200 rounded-[2rem] p-3 sm:p-5 shadow-sm relative transition-all duration-500 flex flex-col"
                         :class="{'border-emerald-400 shadow-emerald-100': p2Complete}">
                        
                        <div class="grid grid-cols-12 gap-0 w-full z-10">
                            <div v-for="c in 12" :key="'carry-'+c" class="h-8 flex items-end justify-center pb-1 text-[11px] sm:text-sm font-black text-indigo-600 relative w-full min-w-[22px] sm:min-w-[30px]">
                                <div v-if="isActiveTaskP2(-1, c)" class="absolute bottom-0 w-6 h-6 bg-yellow-100 rounded-full animate-glow-gold border-2 border-yellow-400 z-0"></div>
                                <div v-if="errorCol && (errorCol === `c${currentTask?.row}-${c}` || errorCol === `csum-${c}`)" class="absolute bottom-0 w-6 h-6 bg-red-100 rounded-full animate-shake-soft animate-glow-red border-2 border-red-500 z-0"></div>
                                <Check v-if="currentTask?.sourceCarryCol === c" :size="14" stroke-width="5" class="text-emerald-500 absolute -top-1 right-0 bg-white/90 rounded-full shadow-sm z-20 animate-bounce-soft" />
                                <span class="z-10 relative">{{ currentTask ? p2Inputs[`c${currentTask.row}-${c}`] || p2Inputs[`csum-${c}`] : '' }}</span>
                            </div>
                        </div>

                        <div class="relative grid grid-cols-12 gap-0 border-t-2 border-l-2 border-slate-100 w-full rounded-tl-xl overflow-hidden bg-slate-50 mt-auto">
                            <template v-for="r in numRows" :key="'row-'+r">
                                <div v-for="c in 12" :key="'cell-'+r+'-'+c"
                                     class="w-full min-w-[22px] sm:min-w-[30px] h-10 sm:h-12 border-b-2 border-r-2 flex items-center justify-center font-mono text-xl sm:text-2xl relative transition-all duration-200"
                                     :class="[
                                         r <= 2 ? 'bg-white text-slate-800 border-slate-100' : 'text-slate-700 border-slate-100',
                                         r === 2 || r === numRows - 1 ? 'border-b-4 border-b-slate-800' : '',
                                         staircaseCells.has(getCellId(r-1, c)) ? 'bg-slate-300 border-2 border-slate-400/60 shadow-inner' : '',
                                         isActiveTaskP2(r-1, c) ? 'bg-yellow-100 border-yellow-400 ring-inset ring-2 ring-yellow-400 animate-glow-gold z-10 text-yellow-900 shadow-md rounded-md' : '',
                                         errorCol && errorCol === getCellId(r-1, c) ? 'bg-red-100 border-red-500 ring-inset ring-2 ring-red-500 animate-shake-soft animate-glow-red z-20 text-red-900 rounded-md' : '',
                                         getUserInputP2(r-1, c) !== '' && !isActiveTaskP2(r-1, c) && errorCol !== getCellId(r-1, c) ? 'bg-emerald-50 text-emerald-900 font-bold' : ''
                                     ]">
                                     
                                     <span v-if="r === 2 && c === 1" class="font-black text-slate-400 mr-1 relative z-20">x</span>
                                     <span v-else-if="r <= 2" class="relative z-20 flex items-center justify-center w-full h-full font-bold">
                                         {{ getStaticCell(r-1, c) }}
                                         <Check v-if="r === 1 && currentTask?.tCol === c" :size="10" stroke-width="5" class="text-emerald-500 absolute top-1 right-1" />
                                         <Check v-if="r === 2 && currentTask?.bCol === c" :size="10" stroke-width="5" class="text-emerald-500 absolute bottom-1 right-1" />
                                     </span>
                                     <span v-else class="z-20">{{ getUserInputP2(r-1, c) }}</span>
                                </div>
                            </template>
                        </div>

                        <div class="w-full flex justify-center mt-4 mb-4 relative z-50 min-h-[50px]">
                            <transition name="fade">
                                <button v-if="p2Complete" ref="recoverCommaBtnRef" @click="startPhase3" 
                                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-full shadow-[0_5px_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm animate-pulse-soft">
                                    RECUPERAR LA COMA <ArrowRight :size="18" />
                                </button>
                            </transition>
                        </div>
                    </div>
                </div>

                <div v-else-if="currentPhase === 'phase3'" key="fase3" class="w-full flex-1 flex flex-col items-center justify-center">
                    
                    <div class="w-full max-w-sm bg-white rounded-[1.5rem] shadow-sm border-2 border-slate-200 p-3 pt-4 mb-3 relative mt-2">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            Memoria
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <div class="flex flex-col gap-1 items-center w-1/3">
                                <span class="text-[9px] font-bold text-slate-400 uppercase text-center">Multiplicando</span>
                                <span class="text-base font-black text-slate-700">{{ exercise.factorA }} <span class="text-orange-500 text-xs font-bold">({{ exercise.decA }})</span></span>
                            </div>
                            <span class="text-slate-300 font-bold w-4 text-center">+</span>
                            <div class="flex flex-col gap-1 items-center w-1/3">
                                <span class="text-[9px] font-bold text-slate-400 uppercase text-center">Multiplicador</span>
                                <span class="text-base font-black text-slate-700">{{ exercise.factorB }} <span class="text-orange-500 text-xs font-bold">({{ exercise.decB }})</span></span>
                            </div>
                            <span class="text-slate-300 font-bold w-4 text-center">=</span>
                            <div class="flex flex-col gap-1 items-center bg-orange-50 px-2 py-1 rounded-xl border border-orange-100 w-1/3">
                                <span class="text-[9px] font-black text-orange-600 uppercase">Total</span>
                                <span class="text-xl font-black text-orange-600">{{ exercise.decTotal }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="w-full max-w-sm bg-white rounded-[1.5rem] shadow-xl border-4 py-5 px-4 flex flex-col items-center transition-colors duration-500"
                         :class="p3Step === 'done' ? 'border-emerald-400 bg-emerald-50 shadow-emerald-200' : 'border-indigo-100'">
                        
                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Resultado Final</span>
                        
                        <transition-group name="comma-jump" tag="div" class="flex text-4xl sm:text-5xl font-black text-slate-800 tracking-wide relative min-h-[56px]">
                            <div v-for="item in finalNumberArray" :key="item.id" 
                                 class="flex items-end justify-center transition-all"
                                 :class="item.val === ',' ? 'text-emerald-500 mx-1 mb-1' : ''">
                                {{ item.val }}
                            </div>
                        </transition-group>

                        <div class="h-12 mt-4 w-full flex items-center justify-center">
                            <transition name="fade" mode="out-in">
                                <div v-if="p3Step === 'intro'" class="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2.5 rounded-full font-bold text-xs animate-pulse-soft border border-indigo-200"
                                     :class="{'animate-shake-soft text-red-600 bg-red-50 border-red-200': errorActive}">
                                    <span class="text-lg">👉</span> Pulsa [ , ] en tu teclado
                                </div>
                                <button v-else @click="proceedNextRound()" 
                                        class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-full shadow-[0_5px_0_#059669] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs animate-bounce-soft">
                                    {{ currentRound < maxRounds ? 'SIGUIENTE DESAFÍO' : 'FINALIZAR' }} <Star :size="18" />
                                </button>
                            </transition>
                        </div>
                    </div>

                </div>
            </transition>
        </main>

        <footer class="w-full pb-4 pt-2 shrink-0 bg-[#f8fafc] border-t border-slate-200 relative z-30">
            <div class="max-w-xs mx-auto">
                <DecimalKeypad @press="handleKeypress" />
            </div>
        </footer>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;500;700&display=swap');

.font-primary { font-family: 'Quicksand', sans-serif; }

.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { position: relative; background-color: #f8fafc; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); user-select: none; -webkit-tap-highlight-color: transparent; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); width: 100vw; height: 100dvh; }

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; box-shadow: 0 40px 100px rgba(0,0,0,0.15); border: 8px solid white; padding: 0; overflow: hidden; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }

.header-standard { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.5rem; background: white; }
.game-title { font-size: clamp(0.85rem, 3vw, 1.2rem); line-height: 1.1; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }

.rules-panel { background: white; padding: 0.8rem 1rem 0.8rem 1rem; border-radius: 1.5rem; border: 2px solid #e2e8f0; position: relative; }
.rules-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); color: white; font-size: 11px; font-weight: 900; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.05em; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

/* Transiciones de Vista */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.4s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

/* ANIMACIÓN: SALTO DE COMA */
.comma-jump-move, .comma-jump-enter-active, .comma-jump-leave-active { transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }

/* SEMÁFORO Y HIGHLIGHTS */
.animate-glow-gold { animation: glow-gold 1.5s infinite ease-in-out; }
@keyframes glow-gold { 0%, 100% { border-color: #fbbf24; box-shadow: 0 0 5px rgba(251, 191, 36, 0.4); } 50% { border-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.7); } }

.animate-glow-red { animation: glow-red 0.5s infinite ease-in-out; }
@keyframes glow-red { 0%, 100% { border-color: #ef4444; box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); } 50% { border-color: #dc2626; box-shadow: 0 0 20px rgba(220, 38, 38, 0.9); } }

.animate-glow-emerald { animation: glow-emerald 1.5s infinite ease-in-out; }
@keyframes glow-emerald { 0%, 100% { border-color: #34d399; box-shadow: 0 0 5px rgba(52, 211, 153, 0.4); } 50% { border-color: #10b981; box-shadow: 0 0 15px rgba(52, 211, 153, 0.8); } }

.animate-shake-soft { animation: shake-soft 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake-soft { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-3px, 0, 0); } 40%, 60% { transform: translate3d(3px, 0, 0); } }

.animate-bounce-soft { animation: bounce-soft 2s infinite; }
@keyframes bounce-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.animate-pulse-soft { animation: pulse-soft 2s infinite; }
@keyframes pulse-soft { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.95; transform: scale(0.98); } }
.animate-spin-slow { animation: spin 8s linear infinite; }
</style>