<script setup>
/** * ARCHIVO: DecimalDiv.vue
 * ESTADO: FASE 7 (V9.1 - PANTALLA VERDE AL FINALIZAR EJERCICIO)
 * LÓGICA: Se movió el check gigante y el fondo verde traslúcido a la transición de finalización.
 */
import { ref, computed, onMounted } from 'vue';
import { ChevronLeft, HelpCircle, Check, RotateCcw, X as CloseIcon, ChevronRight as IconRight, ChevronLeft as IconLeft } from 'lucide-vue-next';
import DecimalKeypad from './DecimalKeypad.vue';

const emit = defineEmits(['close']);

// --- ESTADOS DE GAMIFICACIÓN Y UI ---
const exercises = ref([]);
const currentExIdx = ref(0);
const isTransitioning = ref(false);
const showRewardModal = ref(false);

const errorCol = ref(null); 
const errorClickCoord = ref(null); 
let errorTimeout = null; 

const tasks = ref([]);
const currentTaskIdx = ref(0);
const userInputs = ref({}); 
const selectedIndices = ref(new Set()); 

// --- ESTADOS DEL MANUAL DIDÁCTICO ---
const showHelpModal = ref(false);
const currentHelpSlide = ref(0);
const totalSlides = 6;
const touchStartX = ref(0);
const touchEndX = ref(0);
let isDragging = false;

// --- ESTADOS DE LA PIZARRA DE RAZONAMIENTO ---
const showDecompPopup = ref(false);
const testQuotient = ref(''); 
const decompSuccess = ref(false);
const showSmartTip = ref(false); 

const currentTask = computed(() => tasks.value[currentTaskIdx.value]);
const currentEx = computed(() => exercises.value[currentExIdx.value] || { origDiv: '0', origDvr: '1', adjDiv: '0', adjDvr: '1', divisor: 1 });
const dvrLineCol = computed(() => currentEx.value ? currentEx.value.adjDiv.length + 2 : 6);
const isPrepPhase = computed(() => currentTask.value?.type === 'prep');

// --- LÓGICA MATEMÁTICA DE LA DESCOMPOSICIÓN ---
const decomposedDivisor = computed(() => {
    const numStr = currentEx.value.divisor.toString();
    const parts = [];
    for (let i = numStr.length - 1; i >= 0; i--) {
        const val = parseInt(numStr[numStr.length - 1 - i]) * Math.pow(10, i);
        if (val > 0) parts.push(val);
    }
    return parts; 
});

const decompTotal = computed(() => {
    if (!testQuotient.value) return '?';
    return currentEx.value.divisor * parseInt(testQuotient.value);
});

// --- EL CEREBRO DEL BÚHO ---
const decompOwlMessage = computed(() => {
    if (!showDecompPopup.value) return '';
    const target = currentTask.value.hintPart;

    if (decompSuccess.value) {
        return `¡Maravilloso! <b>${decompTotal.value}</b> es el número ideal para acercarnos a ${target}. <br><span class="text-green-600 font-black">¡Pulsa el check verde para continuar!</span>`;
    }
    
    if (!testQuotient.value) {
        return `Escribe un número en el cociente, que multiplicado por el divisor: <b>${currentEx.value.divisor}</b> nos de un resultado igual al dividendo: <b>${target}</b> o menor. Razonemos.`;
    }
    
    const total = parseInt(decompTotal.value);
    const expectedQ = parseInt(currentTask.value.expected);
    const currentQ = parseInt(testQuotient.value);

    if (currentQ > expectedQ) return `¡Uy! <b>${total}</b> se pasa de ${target}. Intenta con un número <b>MENOR</b>.`;
    if (currentQ < expectedQ) return `Da <b>${total}</b>. Aún podemos acercarnos más a ${target}. Intenta con un número <b>MAYOR</b>.`;
    
    return ''; 
});

const smartTipContent = computed(() => {
    if (!currentTask.value || !currentEx.value) return '';
    
    const target = currentTask.value.hintPart; 
    const dvr = currentEx.value.divisor; 
    const expectedQ = parseInt(currentTask.value.expected); 
    
    if (dvr < 10) return `Prueba multiplicando en tu mente la tabla del ${dvr} hasta acercarte a ${target}.`;

    const dvrStr = String(dvr);
    const firstDigit = parseInt(dvrStr[0]); 
    const zerosCount = dvrStr.length - 1; 
    const firstPartVal = firstDigit * Math.pow(10, zerosCount); 
    const restVal = dvr - firstPartVal; 
    
    const step1 = firstPartVal * expectedQ; 
    const step2 = restVal * expectedQ; 
    const total = step1 + step2; 
    
    return `
        Fíjate en el primer dígito (<b>${firstDigit}</b>).<br>
        Multiplica <b>${firstDigit} &times; ${expectedQ} = ${firstDigit * expectedQ}</b>. Si le agregas el cero, da <b class="text-blue-600">${step1}</b>.<br><br>
        Luego el resto: <b>${restVal} &times; ${expectedQ}</b> da <b class="text-blue-600">${step2}</b>.<br>
        Al sumarlos tienes <b class="text-green-600">${total}</b>.<br><br>
        <i>¡Eso significa que el <b>${expectedQ}</b> es un valor súper apropiado! (A veces puede ser un número menor o mayor, toca ajustar).</i>
    `;
});

const currentMsg = computed(() => {
    if (showDecompPopup.value) return decompOwlMessage.value;
    return currentTask.value?.msg || '¡División completada con éxito!';
});

// --- CONTROLES DE AYUDA ---
const nextSlide = () => currentHelpSlide.value = (currentHelpSlide.value + 1) % totalSlides;
const prevSlide = () => currentHelpSlide.value = (currentHelpSlide.value - 1 + totalSlides) % totalSlides;
const handleTouchStart = (e) => { touchStartX.value = e.changedTouches[0].screenX; };
const handleTouchEnd = (e) => { touchEndX.value = e.changedTouches[0].screenX; handleSwipe(); };
const handleMouseDown = (e) => { isDragging = true; touchStartX.value = e.screenX; };
const handleMouseUp = (e) => { if (!isDragging) return; isDragging = false; touchEndX.value = e.screenX; handleSwipe(); };
const handleMouseLeave = () => { if (isDragging) isDragging = false; };
const handleSwipe = () => {
    const diff = touchEndX.value - touchStartX.value;
    if (diff > 50) prevSlide(); else if (diff < -50) nextSlide(); 
};

const toggleContextualHelp = () => {
    if (showHelpModal.value) { showHelpModal.value = false; return; }
    if (isPrepPhase.value) {
        if (currentTask.value?.id.includes('prep-div')) currentHelpSlide.value = 1; 
        else currentHelpSlide.value = 2; 
    } else if (currentTask.value?.type === 'quotient') {
        if (currentTask.value?.expected === ',') currentHelpSlide.value = 4; 
        else currentHelpSlide.value = 3; 
    } else if (currentTask.value?.type === 'sub' || currentTask.value?.type === 'rem' || currentTask.value?.type === 'drop_dual') {
        currentHelpSlide.value = 3; 
    } else currentHelpSlide.value = 0; 
    showHelpModal.value = true;
};

// --- 1. GENERADOR DE EJERCICIOS ---
const generateBatch = () => {
    let batch = [];
    for(let i = 0; i < 2; i++) {
        let origDvrFloat, origDivFloat, adjDvrNum, adjDivFloat;
        do {
            const dvrInt = Math.floor(Math.random() * 9) + 1; 
            const dvrDec = Math.floor(Math.random() * 9) + 1; 
            origDvrFloat = parseFloat(`${dvrInt}.${dvrDec}`); 

            const qInt = Math.floor(Math.random() * 12) + 2; 
            const qDec = Math.floor(Math.random() * 10); 
            const quotientFloat = parseFloat(`${qInt}.${qDec}`);

            origDivFloat = parseFloat((origDvrFloat * quotientFloat).toFixed(2));
            
            adjDvrNum = Math.round(origDvrFloat * 10);
            adjDivFloat = parseFloat((origDivFloat * 10).toFixed(2));

        } while (origDivFloat >= 100 || origDivFloat < 1); 

        batch.push({ 
            origDiv: origDivFloat.toString().replace('.', ','), 
            origDvr: origDvrFloat.toString().replace('.', ','),
            adjDiv: adjDivFloat.toString().replace('.', ','), 
            adjDvr: adjDvrNum.toString(), 
            divisor: adjDvrNum 
        });
    }
    exercises.value = batch;
    currentExIdx.value = 0;
    setupExercise();
};

const setupExercise = () => {
    userInputs.value = {};
    selectedIndices.value.clear();
    currentTaskIdx.value = 0;
    isTransitioning.value = false;
    errorCol.value = null;
    errorClickCoord.value = null;
    showDecompPopup.value = false;
    testQuotient.value = '';
    decompSuccess.value = false;
    showSmartTip.value = false;
    buildTaskQueue();
};

// --- 2. ALGORITMO Y CREADOR DE TAREAS ---
const buildTaskQueue = () => {
    let q = [];
    const ex = currentEx.value;
    const divOrigIsInteger = !String(ex.origDiv).includes(',');
    
    const focusBadge = (digit) => {
        const article = digit === ',' ? 'la' : 'el';
        return `<span class="inline-block bg-[#FEF9C3] text-slate-800 px-2.5 py-0.5 rounded-full border border-[#FDE047] ml-1 tracking-wider whitespace-nowrap shadow-sm">Escribe ${article} <b class="text-amber-600">${digit}</b></span>`;
    };

    const adjDivStr = ex.adjDiv;
    for(let i=0; i<adjDivStr.length; i++) {
        q.push({
            id: `prep-div-${i}`, expected: adjDivStr[i],
            msg: divOrigIsInteger 
                 ? `Equilibra la división: Multiplica el dividendo <b>${ex.origDiv}</b> por 10 = <b>${ex.adjDiv}</b>. Como no tiene coma, añade un cero al final. ${focusBadge(adjDivStr[i])}`
                 : `Equilibra la división: Multiplica el dividendo <b>${ex.origDiv}</b> por 10 = <b>${ex.adjDiv}</b>. Corre la coma un espacio a la derecha. ${focusBadge(adjDivStr[i])}`,
            type: 'prep'
        });
    }

    const adjDvrStr = ex.adjDvr;
    for(let i=0; i<adjDvrStr.length; i++) {
        q.push({
            id: `prep-dvr-${i}`, expected: adjDvrStr[i],
            msg: `El divisor <b>${ex.origDvr}</b> tiene decimales. Multiplícalo por 10 = <b>${ex.adjDvr}</b>. (Corre la coma un espacio a la derecha). ${focusBadge(adjDvrStr[i])}`,
            type: 'prep'
        });
    }

    const divStr = ex.adjDiv; 
    const cleanDivStr = divStr.replace(',', ''); 
    const commaIdx = divStr.indexOf(','); 
    const dvr = ex.divisor;
    
    const getGridCol = (cleanIdx) => {
        let col = 2 + cleanIdx;
        if (commaIdx !== -1 && col >= 2 + commaIdx) col++;
        return col;
    };

    let qCol = dvrLineCol.value + 1; 
    let workRow = 2; 

    let take = 1;
    let initialPart = parseInt(cleanDivStr.substring(0, take));
    while (initialPart < dvr && take < cleanDivStr.length) {
        take++;
        initialPart = parseInt(cleanDivStr.substring(0, take));
    }

    for (let i = 0; i < take; i++) {
        const isLast = i === take - 1;
        const formedNum = cleanDivStr.substring(0, i + 1);
        q.push({
            id: `sel-${i}`, type: 'select_top', digitIdx: i, expected: cleanDivStr[i],
            row: 1, col: getGridCol(i), 
            msg: isLast 
                 ? `Selecciona el <b>${cleanDivStr[i]}</b>. Formamos ${formedNum}. ¡Ya es mayor que ${dvr}!`
                 : `Selecciona el <b>${cleanDivStr[i]}</b>. Formamos ${formedNum}, pero aún es menor que ${dvr}.`
        });
    }

    let currentPart = initialPart;
    let processedIndex = take - 1; 

    while (processedIndex < cleanDivStr.length) {
        const quotientDigit = Math.floor(currentPart / dvr);
        const product = quotientDigit * dvr;
        const subResult = currentPart - product;

        q.push({
            id: `q${processedIndex}`, expected: quotientDigit.toString(),
            msg: `Escribe un número en el cociente, que multiplicado por el divisor: <b>${dvr}</b> nos de un resultado igual al dividendo: <b>${currentPart}</b> o menor. ¡Razonemos!`,
            type: 'quotient', row: 2, col: qCol, needsPedagogicDeduction: true, hintPart: currentPart
        });
        qCol++;

        let carry = 0;
        let multSteps = [];
        let dStr = dvr.toString();
        
        for(let idx = dStr.length - 1; idx >= 0; idx--) {
            let d = parseInt(dStr[idx]);
            let p = d * quotientDigit + carry;
            let w = p % 10;
            let nextCarry = Math.floor(p / 10);
            multSteps.push({ d, q: quotientDigit, p, w, carry, nextCarry, isLastCarry: false });
            carry = nextCarry;
        }
        if (carry > 0) {
            multSteps.push({ d: 0, q: quotientDigit, p: carry, w: carry, carry, nextCarry: 0, isLastCarry: true });
        }

        const prodStr = product.toString();
        for (let k = prodStr.length - 1; k >= 0; k--) {
            const cleanIdxForDigit = processedIndex - (prodStr.length - 1 - k);
            const digitCol = getGridCol(cleanIdxForDigit);
            
            const stepIndex = (prodStr.length - 1) - k;
            const step = multSteps[stepIndex];
            let stepMsg = "";

            if (stepIndex === 0) {
                stepMsg = `¡A multiplicar de derecha a izquierda! <b>${step.q} &times; ${step.d} = ${step.p}</b>. Escribe el <b>${step.w}</b>${step.nextCarry > 0 ? ` y llevas <b>${step.nextCarry}</b>` : ''}.`;
            } else if (step.isLastCarry) {
                stepMsg = `Escribe el <b>${step.w}</b> que llevabas.`;
            } else {
                stepMsg = `Multiplica el siguiente: <b>${step.q} &times; ${step.d} = ${step.q * step.d}</b>${step.carry > 0 ? ` + <b>${step.carry}</b> de llevada` : ''} = <b>${step.p}</b>. Escríbelo${step.nextCarry > 0 ? ` y llevas <b>${step.nextCarry}</b>` : ''}.`;
            }

            q.push({
                id: `s${processedIndex}-${k}`, expected: prodStr[k],
                msg: stepMsg,
                type: 'sub', row: workRow, col: digitCol
            });
        }

        const remStr = subResult.toString();
        for (let k = remStr.length - 1; k >= 0; k--) {
            const cleanIdxForDigit = processedIndex - (remStr.length - 1 - k);
            const digitCol = getGridCol(cleanIdxForDigit);
            q.push({
                id: `r${processedIndex}-${k}`, expected: remStr[k],
                msg: k === remStr.length - 1
                     ? `¡A restar! <b>${currentPart} &minus; ${product} = ${subResult}</b>. Escribe en la casilla correspondiente.`
                     : `Sigamos con la resta. Escribe el <b>${remStr[k]}</b>.`,
                type: 'rem', row: workRow + 1, col: digitCol
            });
        }

        let nextCleanIdx = processedIndex + 1;
        if (nextCleanIdx < cleanDivStr.length) {
            if (commaIdx !== -1 && nextCleanIdx === commaIdx) {
                q.push({
                    id: `qc${processedIndex}`, expected: ',',
                    msg: `¡Atención! Llegamos a los decimales del dividendo. <b>Coloca la coma en el cociente</b> antes de continuar.`,
                    type: 'quotient', row: 2, col: qCol
                });
                qCol++;
            }

            const nextDigit = cleanDivStr[nextCleanIdx];
            q.push({
                id: `d${nextCleanIdx}`, expected: nextDigit,
                msg: `Para bajar el siguiente número, tócalo en la pizarra o teclea el <b>${nextDigit}</b>.`,
                type: 'drop_dual', row: workRow + 1, col: getGridCol(nextCleanIdx), topDigitIdx: nextCleanIdx
            });
            currentPart = parseInt(subResult.toString() + nextDigit);
            processedIndex++;
            workRow += 2;
        } else {
            break; 
        }
    }
    tasks.value = q;
};

// --- 3. INTERACCIÓN ---
const advanceTask = () => {
    currentTaskIdx.value++;
    errorCol.value = null;
    errorClickCoord.value = null;
    if (errorTimeout) clearTimeout(errorTimeout);
    
    decompSuccess.value = false;
    testQuotient.value = '';
    showSmartTip.value = false;

    if (currentTask.value && currentTask.value.needsPedagogicDeduction) {
        showDecompPopup.value = true;
    } else {
        showDecompPopup.value = false;
    }

    if (currentTaskIdx.value >= tasks.value.length) completeExercise();
};

const handleDelete = () => {
    if (isTransitioning.value || showRewardModal.value || showHelpModal.value) return;
    if (showDecompPopup.value && !decompSuccess.value) { 
        testQuotient.value = ''; 
        return; 
    }
};

const handleKeypress = (key) => {
    if (isTransitioning.value || showRewardModal.value || showHelpModal.value || !currentTask.value) return;
    
    if (key === 'Enter') {
        if (showDecompPopup.value && decompSuccess.value) verifyDecompStep();
        return;
    }
    if (key === 'c' || key === 'Backspace' || key === 'Delete') {
        handleDelete();
        return;
    }

    if (!/[0-9,]/.test(key)) return;
    const inputStr = key.toString();

    if (showDecompPopup.value) {
        if (decompSuccess.value) return; 
        if (!/[0-9]/.test(key)) return; 
        
        testQuotient.value = inputStr; 
        if (inputStr === currentTask.value.expected) {
            decompSuccess.value = true;
            try { new Audio('/audios/success.mp3').play(); } catch(e){}
        } else {
            decompSuccess.value = false;
            try { new Audio('/audios/select.mp3').play(); } catch(e){}
        }
        return;
    }

    if (currentTask.value.type === 'select_top') {
        if (inputStr === currentTask.value.expected) {
            selectedIndices.value.add(currentTask.value.digitIdx);
            try { new Audio('/audios/success.mp3').play(); } catch(e){}
            advanceTask();
        } else triggerError(currentTask.value.id);
        return; 
    }

    if (currentTask.value.type === 'drop_dual') {
        if (inputStr === currentTask.value.expected) {
            selectedIndices.value.add(currentTask.value.topDigitIdx);
            userInputs.value[currentTask.value.id] = inputStr;
            try { new Audio('/audios/success.mp3').play(); } catch(e){}
            advanceTask();
        } else triggerError(currentTask.value.id);
        return;
    }

    if (currentTask.value.needsPedagogicDeduction && !showDecompPopup.value) return; 

    if (inputStr === currentTask.value.expected) {
        userInputs.value[currentTask.value.id] = inputStr;
        advanceTask();
    } else {
        triggerError(currentTask.value.id);
    }
};

const verifyDecompStep = () => {
    if (testQuotient.value === currentTask.value.expected) {
        showDecompPopup.value = false;
        decompSuccess.value = false; 
        userInputs.value[currentTask.value.id] = currentTask.value.expected;
        testQuotient.value = '';
        advanceTask();
    }
};

const handleGridClick = (r, c) => {
    if (isTransitioning.value || showRewardModal.value || showHelpModal.value || !currentTask.value || showDecompPopup.value) return;
    
    const commaIdx = currentEx.value.adjDiv.indexOf(',');
    const getGridCol = (cleanIdx) => {
        let col = 2 + cleanIdx;
        if (commaIdx !== -1 && col >= 2 + commaIdx) col++;
        return col;
    };

    if (currentTask.value.type === 'select_top') {
        const expectedCol = getGridCol(currentTask.value.digitIdx);
        if (r === 1 && c === expectedCol) {
            selectedIndices.value.add(currentTask.value.digitIdx);
            try { new Audio('/audios/success.mp3').play(); } catch(e){}
            advanceTask();
        } else {
            if (navigator.vibrate) navigator.vibrate(200);
            errorClickCoord.value = `${r}-${c}`;
            if (errorTimeout) clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => { errorClickCoord.value = null; }, 600);
        }
        return;
    }

    if (currentTask.value.type === 'drop_dual') {
        const expectedColTop = getGridCol(currentTask.value.topDigitIdx);
        const expectedColBot = currentTask.value.col;
        const expectedRowBot = currentTask.value.row;

        if ((r === 1 && c === expectedColTop) || (r === expectedRowBot && c === expectedColBot)) {
            selectedIndices.value.add(currentTask.value.topDigitIdx);
            userInputs.value[currentTask.value.id] = currentTask.value.expected;
            try { new Audio('/audios/success.mp3').play(); } catch(e){}
            advanceTask();
        } else {
            if (navigator.vibrate) navigator.vibrate(200);
            errorClickCoord.value = `${r}-${c}`;
            if (errorTimeout) clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => { errorClickCoord.value = null; }, 600);
        }
        return;
    }
};

const triggerError = (id) => {
    errorCol.value = id;
    if (navigator.vibrate) navigator.vibrate(200);
    try { new Audio('/audios/wrong1.mp3').play(); } catch(e){}
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => { errorCol.value = null; }, 500); 
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

// --- HELPERS DE RENDERIZADO ---
const getStaticCell = (r, c) => {
    const divStr = currentEx.value.adjDiv;
    if (r === 1 && c >= 2 && c < 2 + divStr.length) return divStr[c - 2];
    const dvrStr = currentEx.value.adjDvr;
    if (r === 1 && c >= dvrLineCol.value && c < dvrLineCol.value + dvrStr.length) return dvrStr[c - dvrLineCol.value];
    return '';
};

const isActiveTask = (row, col) => {
    if (isPrepPhase.value) return false;
    if (!currentTask.value) return false;
    return currentTask.value.row === row && currentTask.value.col === col;
};

const isActiveTaskPrep = (id) => isPrepPhase.value && currentTask.value?.id === id;

const isClickTarget = (r, c) => {
    if (!currentTask.value) return false;
    if (isActiveTask(r, c) && currentTask.value.type === 'select_top') return true;
    
    if (currentTask.value.type === 'drop_dual') {
        const commaIdx = currentEx.value.adjDiv.indexOf(',');
        let expectedCol = 2 + currentTask.value.topDigitIdx;
        if (commaIdx !== -1 && expectedCol >= 2 + commaIdx) expectedCol++;
        if (r === 1 && c === expectedCol) return true;
        if (r === currentTask.value.row && c === currentTask.value.col) return true;
    }
    return false; 
};

const getCellId = (row, col) => tasks.value.find(t => t.row === row && t.col === col && t.type !== 'select_top' && t.type !== 'drop_dual')?.id || null;

const showSubLine = (r, c) => {
    const task = tasks.value.find(t => t.type === 'sub' && t.row === r && t.col === c);
    return task && userInputs.value[task.id] !== undefined;
};

const showApostrophe = (r, c) => {
    if (r !== 1) return false;
    const divStr = currentEx.value.adjDiv;
    if (c < 2 || c >= 2 + divStr.length) return false;
    if (divStr[c - 2] === ',') return false;
    const commaIdx = divStr.indexOf(',');
    let cleanIdx = c - 2;
    if (commaIdx !== -1 && (c - 2) > commaIdx) cleanIdx -= 1; 
    return selectedIndices.value.has(cleanIdx);
};

const isCellCompleted = (row, col) => {
    const task = tasks.value.find(t => t.row === row && t.col === col && (t.type !== 'select_top'));
    return task && userInputs.value[task.id] !== undefined && currentTask.value?.id !== task.id;
};
const getCellValue = (row, col) => {
    const task = tasks.value.find(t => t.row === row && t.col === col && (t.type !== 'select_top'));
    return task ? userInputs.value[task.id] || '' : '';
};
const getCellError = (row, col) => {
    const task = tasks.value.find(t => t.row === row && t.col === col && (t.type !== 'select_top'));
    return task ? errorCol.value === task.id : false;
};

onMounted(() => {
    generateBatch();
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') handleKeypress(e.key);
        else if(/[0-9,]/.test(e.key)) handleKeypress(e.key);
    });
});
</script>

<template>
  <div class="w-full h-full flex flex-col bg-[#4F46E5] overflow-hidden animate-fade-in relative font-primary text-slate-800">
    
    <div v-if="showRewardModal" class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-hidden">
        <div class="absolute inset-0 pointer-events-none z-0">
            <div v-for="n in 25" :key="n" class="confetti-piece" 
                 :style="{ left: Math.random() * 100 + '%', animationDuration: (Math.random() * 2 + 2) + 's', animationDelay: Math.random() * 2 + 's' }">
                {{ ['🎉', '✨', '🎊', '⭐', '🦉'][Math.floor(Math.random() * 5)] }}
            </div>
        </div>

        <div class="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform scale-100 transition-all z-10 border-4 border-yellow-400">
            <div class="text-7xl mb-4 animate-bounce-soft">🏆</div>
            <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wide">¡Misión Cumplida!</h2>
            <p class="text-slate-600 mb-8 font-medium text-lg">Dominaste las divisiones como todo un Búho Experto.</p>
            <div class="flex flex-col gap-3 w-full">
                <button @click="restartGame" class="w-full py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-black rounded-xl shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all text-lg flex justify-center items-center gap-2">
                    <RotateCcw :size="22" stroke-width="3" /> Siguiente Reto
                </button>
                <button @click="emit('close')" class="w-full py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2">
                    <CloseIcon :size="20" /> Salir al Lobby
                </button>
            </div>
        </div>
    </div>

    <div v-if="showHelpModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
        <div class="bg-white rounded-[2rem] w-full max-w-[440px] shadow-2xl overflow-hidden flex flex-col relative h-full max-h-[850px] border-4 border-blue-200">
            <header class="w-full flex justify-between items-center px-5 py-3 sm:py-4 border-b-2 border-slate-100 bg-blue-50/80 shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg sm:text-xl shadow-md">🦉</div>
                    <span class="text-blue-700 font-black text-lg sm:text-xl tracking-wide uppercase">Guía del Mago</span>
                </div>
                <button @click="toggleContextualHelp" class="p-2 text-slate-400 hover:text-red-500 bg-white shadow-sm hover:bg-red-50 rounded-full transition active:scale-95"><CloseIcon :size="24" /></button>
            </header>

            <div class="flex-1 overflow-hidden relative bg-slate-50 cursor-grab active:cursor-grabbing"
                 @touchstart="handleTouchStart" @touchend="handleTouchEnd"
                 @mousedown="handleMouseDown" @mouseup="handleMouseUp" @mouseleave="handleMouseLeave">
                
                <div class="absolute inset-0 flex h-full transition-transform duration-500 ease-out" 
                     :style="{ transform: `translateX(-${currentHelpSlide * (100/totalSlides)}%)`, width: `${totalSlides * 100}%` }">
                    
                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-6xl sm:text-8xl mb-3 sm:mb-6 animate-bounce-soft drop-shadow-lg">⚡</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-2 sm:mb-3 uppercase tracking-wide">1. El Superpoder</h2>
                        <p class="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">¡Simplifica! El secreto para dividir números complejos es transformar los decimales en <b class="text-blue-600">ENTEROS</b>.</p>
                        <div class="mt-4 sm:mt-8 flex flex-col items-center justify-center gap-2 bg-white p-3 sm:p-5 rounded-2xl shadow-md border border-slate-200 w-full">
                            <span class="font-black text-xl sm:text-2xl text-slate-700 bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">4,8 &divide; 1,2</span>
                            <span class="text-blue-500 font-bold rotate-90 my-1 sm:my-2 text-xl sm:text-2xl">&rarr;</span>
                            <span class="font-black text-2xl sm:text-3xl text-blue-600 bg-blue-50 px-4 sm:px-5 py-2 sm:py-3 rounded-2xl ring-4 ring-blue-200 animate-pulse">48 &divide; 12</span>
                        </div>
                    </div>

                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-5xl sm:text-7xl mb-2 sm:mb-4 drop-shadow-lg">🕵️‍♂️</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-2 sm:mb-3 uppercase tracking-wide">2. ¿Quién es Quién?</h2>
                        <p class="text-slate-600 font-medium text-sm sm:text-base mb-4 sm:mb-8">Reconocer los roles es el primer paso vital.</p>
                        <div class="flex flex-col gap-3 sm:gap-5 w-full">
                            <div class="bg-blue-50 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col justify-center items-center border-b-4 border-blue-200 shadow-sm relative overflow-hidden">
                                <div class="absolute -right-2 top-1 text-4xl sm:text-5xl opacity-5 font-black text-blue-900 -rotate-6 tracking-tighter">4.8</div>
                                <span class="font-black text-blue-700 text-xl sm:text-2xl mb-1 sm:mb-2 z-10">Dividendo</span>
                                <span class="font-bold text-slate-600 text-xs sm:text-sm bg-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-inner z-10">El número a repartir</span>
                            </div>
                            <div class="bg-orange-50 rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col justify-center items-center border-b-4 border-orange-200 shadow-sm relative overflow-hidden">
                                <div class="absolute -right-2 top-1 text-4xl sm:text-5xl opacity-5 font-black text-orange-900 -rotate-6 tracking-tighter">1.2</div>
                                <span class="font-black text-orange-700 text-xl sm:text-2xl mb-1 sm:mb-2 z-10">Divisor</span>
                                <span class="font-bold text-slate-600 text-xs sm:text-sm bg-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-inner z-10">Las partes a crear</span>
                            </div>
                        </div>
                    </div>

                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-5xl sm:text-7xl mb-2 sm:mb-4 drop-shadow-lg">⚖️</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-2 sm:mb-3 uppercase tracking-wide text-balance">3. Justicia Matemática</h2>
                        <p class="text-slate-600 font-medium text-sm sm:text-base mb-4 sm:mb-8">Para quitar la coma, multiplicamos por 10. Pero recuerda la <b class="text-amber-600">Regla de Oro</b>: lo que le haces al divisor, debes hacérselo al dividendo.</p>
                        <div class="flex flex-col gap-3 sm:gap-4 w-full">
                            <div class="flex items-center justify-between bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100">
                                <span class="font-bold text-slate-600 text-lg sm:text-xl">4,8 <span class="text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ml-1">&times; 10</span></span>
                                <span class="font-black text-xl sm:text-2xl text-slate-800 bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">= 48</span>
                            </div>
                            <div class="flex items-center justify-between bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100">
                                <span class="font-bold text-slate-600 text-lg sm:text-xl">1,2 <span class="text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg ml-1">&times; 10</span></span>
                                <span class="font-black text-xl sm:text-2xl text-slate-800 bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl">= 12</span>
                            </div>
                        </div>
                        <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-left flex gap-2 items-start shadow-sm w-full">
                            <span class="text-lg leading-none mt-0.5">💡</span>
                            <p class="text-slate-700 text-[11px] sm:text-xs leading-snug"><b>Truco ninja:</b> Para multiplicar por 10, solo debes <b>correr la coma hacia la derecha</b> un espacio.</p>
                        </div>
                    </div>

                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-5xl sm:text-7xl mb-2 sm:mb-4 drop-shadow-lg">🔢</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-4 sm:mb-6 uppercase tracking-wide">4. RESOLUCIÓN</h2>
                        <div class="grid grid-cols-2 gap-2 sm:gap-4 w-full">
                            <div class="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-600 font-black text-lg sm:text-xl flex items-center justify-center mb-1.5 sm:mb-2">1</div>
                                <span class="font-black text-sm sm:text-base text-slate-700">BUSCA</span>
                                <span class="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5 sm:mt-1">¿Cuántas veces cabe?</span>
                            </div>
                            <div class="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-600 font-black text-lg sm:text-xl flex items-center justify-center mb-1.5 sm:mb-2">&times;</div>
                                <span class="font-black text-sm sm:text-base text-slate-700">MULTIPLICA</span>
                                <span class="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5 sm:mt-1">De der. a izq.</span>
                            </div>
                            <div class="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 text-red-600 font-black text-lg sm:text-xl flex items-center justify-center mb-1.5 sm:mb-2">&minus;</div>
                                <span class="font-black text-sm sm:text-base text-slate-700">RESTA</span>
                                <span class="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5 sm:mt-1">Halla el residuo.</span>
                            </div>
                            <div class="bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col items-center hover:shadow-md transition-shadow">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 text-yellow-600 font-black text-lg sm:text-xl flex items-center justify-center mb-1.5 sm:mb-2">&darr;</div>
                                <span class="font-black text-sm sm:text-base text-slate-700">BAJA</span>
                                <span class="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5 sm:mt-1">Siguiente número.</span>
                            </div>
                        </div>
                    </div>

                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-5xl sm:text-7xl mb-2 sm:mb-4 drop-shadow-lg">🛟</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-2 sm:mb-3 uppercase tracking-wide">5. ¿Sobran Números?</h2>
                        <p class="text-slate-600 font-medium text-sm sm:text-base mb-4 sm:mb-6">Si queda residuo y quieres ser exacto: <br><b class="text-blue-600">Añade un cero mágico y pon una coma en el cociente.</b></p>
                        <div class="bg-white p-4 sm:p-6 rounded-3xl shadow-inner border-2 border-dashed border-blue-200 w-full flex justify-center items-center">
                            <div class="font-mono text-2xl sm:text-3xl font-black text-slate-700 flex items-start">
                                <div class="flex flex-col items-end pr-2 sm:pr-3">
                                    <span class="tracking-[0.2em]">10</span>
                                    <span class="text-red-500 tracking-[0.2em] relative"><span class="absolute -left-5 sm:-left-6">-</span>8</span>
                                    <div class="w-[120%] border-t-4 border-slate-400 pt-1 sm:pt-2 mt-1 flex justify-end">
                                        <span class="tracking-[0.2em]">2<span class="text-blue-500 animate-pulse text-3xl sm:text-4xl">0</span></span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="border-b-4 border-l-4 border-slate-400 pl-2 sm:pl-3 pb-1 w-full text-left">
                                        <span class="tracking-[0.2em]">4</span>
                                    </div>
                                    <div class="pt-2 pl-2 sm:pl-3 w-full text-left">
                                        <span class="text-blue-600 bg-blue-50 px-1 sm:px-2 rounded-lg tracking-[0.2em]">2<span class="text-red-500 font-sans mx-0.5">,</span>5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center shrink-0" :style="{ width: `${100/totalSlides}%` }">
                        <div class="text-5xl sm:text-7xl mb-3 sm:mb-6 drop-shadow-lg">🏆</div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-800 mb-4 sm:mb-6 uppercase tracking-wide">Resumen de Éxito</h2>
                        <ul class="text-left flex flex-col gap-3 sm:gap-5 font-medium text-slate-700 text-sm sm:text-base bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border-2 border-slate-100 w-full">
                            <li class="flex items-start gap-2 sm:gap-3"><Check class="text-white bg-green-500 rounded-full p-1 shrink-0 mt-0.5" :size="24"/> Multiplica por 10 para quitar comas.</li>
                            <li class="flex items-start gap-2 sm:gap-3"><Check class="text-white bg-green-500 rounded-full p-1 shrink-0 mt-0.5" :size="24"/> Resuelve como enteros normales.</li>
                            <li class="flex items-start gap-2 sm:gap-3"><Check class="text-white bg-green-500 rounded-full p-1 shrink-0 mt-0.5" :size="24"/> Escribe de <b>derecha a izquierda</b>.</li>
                        </ul>
                    </div>

                </div>
            </div>

            <footer class="w-full px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between border-t-2 border-slate-100 shrink-0 bg-white">
                <button @click="prevSlide" class="p-2 sm:p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors active:scale-95 shadow-sm">
                    <IconLeft class="w-5 h-5 sm:w-7 sm:h-7" />
                </button>
                <div class="flex gap-2 sm:gap-2.5">
                    <div v-for="i in totalSlides" :key="i" class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300" :class="currentHelpSlide === i-1 ? 'bg-blue-500 w-6 sm:w-8' : 'bg-slate-200'"></div>
                </div>
                <button @click="nextSlide" class="p-2 sm:p-3 rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition-colors active:scale-95">
                    <IconRight class="w-5 h-5 sm:w-7 sm:h-7" />
                </button>
            </footer>
        </div>
    </div>

    <header class="flex items-center justify-between px-4 py-2 shrink-0 text-white z-20">
        <button @click="emit('close')" class="flex items-center gap-1 font-semibold text-sm hover:text-blue-200 transition-colors">
            <ChevronLeft :size="20" /> VOLVER
        </button>
        <div class="flex items-center gap-3">
            <h1 class="font-bold text-lg tracking-widest">DIVISIÓN</h1>
            <span class="text-sm font-medium text-blue-100">{{ currentExIdx + 1 }} / 2</span>
        </div>
        <button @click="toggleContextualHelp" class="p-1 border-2 border-white/50 rounded-full hover:bg-white/10 transition-colors relative z-[210]">
            <HelpCircle :size="18" />
            <span v-if="currentExIdx === 0 && currentTaskIdx === 0 && !showHelpModal" class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-yellow-500 border border-white"></span>
            </span>
        </button>
    </header>

    <div class="px-4 z-20 mb-3 w-full max-w-[480px] mx-auto flex items-center mt-1">
        <div class="bg-white rounded-xl p-2.5 shadow-sm flex items-start gap-3 border-b-2 border-slate-200 flex-1">
            <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-xl shrink-0 border border-blue-100 shadow-inner">🦉</div>
            <div class="flex-1 pt-1">
                <p class="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 leading-none">Profesor Búho dice:</p>
                <p class="text-sm font-semibold text-slate-700 leading-snug" v-html="currentMsg"></p>
            </div>
        </div>
    </div>

    <main class="flex-1 w-full px-4 pb-2 flex flex-col items-center justify-start z-[120] relative overflow-hidden gap-2">
        <div class="w-full max-w-[480px] bg-[#FEF9C3] border border-[#FDE047] rounded-2xl p-1.5 sm:p-2 shadow-sm relative flex flex-col flex-1 overflow-hidden z-10">
            
            <div class="bg-white rounded-xl w-full h-full shadow-inner flex flex-col overflow-hidden relative z-10">
                
                <div v-if="isTransitioning" class="absolute inset-0 z-50 flex items-center justify-center bg-green-500/20 backdrop-blur-md rounded-xl overflow-hidden animate-fade-in">
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <Check :size="250" stroke-width="4" class="text-green-600 transform rotate-12 scale-150" />
                    </div>
                    <div class="bg-white rounded-full p-6 shadow-2xl animate-bounce-soft border-8 border-green-500 relative z-10">
                        <Check :size="80" stroke-width="5" class="text-green-500" />
                    </div>
                </div>

                <div class="w-full flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center pt-2">
                    
                    <div v-if="isPrepPhase" class="w-full flex flex-col items-center gap-4 animate-fade-in px-4 mx-auto max-w-[380px] pb-4">
                        <div class="text-center w-full mb-1 border-b border-slate-100 pb-4">
                            <span class="bg-blue-50 text-blue-600 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">Desarrollo Inicial</span>
                            <div class="flex items-start justify-center gap-3 mt-4">
                                <span class="text-slate-700 font-bold text-[16px] pt-1">Misión: Dividir</span>
                                <div class="flex flex-col items-center">
                                    <b class="text-[20px] leading-none text-slate-800">{{ currentEx.origDiv }}</b>
                                    <span class="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded mt-1 uppercase">Dividendo</span>
                                </div>
                                <span class="text-slate-700 font-bold text-[20px] pt-0.5">&divide;</span>
                                <div class="flex flex-col items-center">
                                    <b class="text-[20px] leading-none text-slate-800">{{ currentEx.origDvr }}</b>
                                    <span class="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded mt-1 uppercase">Divisor</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-col gap-3 w-full">
                            <div class="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div class="flex flex-col items-start">
                                    <span class="text-[10px] font-bold text-blue-500 uppercase mb-0.5">1. Arreglar Dividendo</span>
                                    <span class="text-[16px] font-semibold text-slate-700">{{ currentEx.origDiv }} <span class="text-blue-400 font-bold">&times; 10 =</span></span>
                                </div>
                                <div class="flex gap-1.5">
                                    <div v-for="(d, i) in currentEx.adjDiv" :key="'pdiv-'+i"
                                         class="w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center text-xl font-black transition-colors bg-white"
                                         :class="[ isActiveTaskPrep('prep-div-'+i) ? 'border-yellow-300 bg-yellow-50' : 
                                                   (userInputs['prep-div-'+i] ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-200 text-slate-700'),
                                                   errorCol === 'prep-div-'+i ? 'bg-red-50 border-red-400 text-red-500 animate-shake' : '']">
                                         <span :class="{'animate-pulse text-amber-500': isActiveTaskPrep('prep-div-'+i)}">
                                             {{ userInputs['prep-div-'+i] || (isActiveTaskPrep('prep-div-'+i) ? '_' : '') }}
                                         </span>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div class="flex flex-col items-start">
                                    <span class="text-[10px] font-bold text-orange-500 uppercase mb-0.5">2. Arreglar Divisor</span>
                                    <span class="text-[16px] font-semibold text-slate-700">{{ currentEx.origDvr }} <span class="text-blue-400 font-bold">&times; 10 =</span></span>
                                </div>
                                <div class="flex gap-1.5">
                                    <div v-for="(d, i) in currentEx.adjDvr" :key="'pd-'+i"
                                         class="w-9 h-9 sm:w-10 sm:h-10 border rounded-full flex items-center justify-center text-xl font-black transition-colors bg-white"
                                         :class="[ isActiveTaskPrep('prep-dvr-'+i) ? 'border-yellow-300 bg-yellow-50' : 
                                                   (userInputs['prep-dvr-'+i] ? 'bg-green-50 border-green-300 text-green-700' : 'border-slate-200 text-slate-700'),
                                                   errorCol === 'prep-dvr-'+i ? 'bg-red-50 border-red-400 text-red-500 animate-shake' : '']">
                                         <span :class="{'animate-pulse text-amber-500': isActiveTaskPrep('prep-dvr-'+i)}">
                                             {{ userInputs['prep-dvr-'+i] || (isActiveTaskPrep('prep-dvr-'+i) ? '_' : '') }}
                                         </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="grid grid-cols-12 gap-0 font-mono text-[22px] sm:text-2xl text-slate-800 w-full max-w-[420px] mx-auto pb-4 animate-fade-in pt-4 select-none">
                        <template v-for="r in 10" :key="'r-'+r">
                            <div v-for="c in 12" :key="'c-'+r+'-'+c" 
                                 @click="handleGridClick(r, c)"
                                 class="h-9 flex items-center justify-center relative transition-all duration-200"
                                 :class="{
                                     'border-l-2 border-slate-300': (r === 1 || r === 2) && c === dvrLineCol,
                                     'border-b-2 border-slate-300': r === 1 && c >= dvrLineCol && c <= dvrLineCol + currentEx.adjDvr.length - 1,
                                     'cursor-pointer': isClickTarget(r, c)
                                 }">
                                 
                                 <div v-if="isActiveTask(r, c) && !showDecompPopup" class="absolute inset-0 bg-yellow-50/80 border border-yellow-200 z-10 rounded m-0.5 pointer-events-none"></div>
                                 <div v-if="isClickTarget(r, c) && !showDecompPopup" class="absolute inset-0 bg-yellow-50/80 border border-yellow-200 z-10 rounded m-0.5 hover:bg-yellow-100/80 transition-colors"></div>
                                 
                                 <div v-if="isCellCompleted(r, c)" class="absolute inset-0 bg-green-50 border border-green-100 z-10 rounded m-0.5 pointer-events-none"></div>

                                 <div v-if="getCellError(r, c)" class="absolute inset-0 bg-red-50 border border-red-200 animate-shake z-10 rounded m-0.5 pointer-events-none"></div>
                                 <div v-if="errorClickCoord === `${r}-${c}`" class="absolute inset-0 bg-red-50 border border-red-200 animate-shake z-10 rounded m-0.5 pointer-events-none"></div>

                                 <span v-if="getStaticCell(r, c)" class="z-20 font-semibold relative" :class="{'text-blue-700': c >= dvrLineCol}">
                                     {{ getStaticCell(r, c) }}
                                     <span v-if="showApostrophe(r, c)" 
                                           class="absolute -top-1.5 -right-2 text-green-500 font-black text-xl leading-none pointer-events-none">'</span>
                                 </span>
                                 
                                 <span v-else class="z-20 font-medium pointer-events-none flex items-center justify-center w-full h-full" :class="{'text-blue-700 font-semibold': r === 2 && c >= dvrLineCol}">
                                     <span v-if="isActiveTask(r, c) && !showDecompPopup" class="animate-pulse text-amber-500 font-bold">{{ getCellValue(r, c) || '_' }}</span>
                                     <span v-else>{{ getCellValue(r, c) }}</span>
                                 </span>
                                 
                                 <div v-if="showSubLine(r, c)" class="absolute bottom-0 w-[105%] border-b-2 border-slate-200 z-10 left-0 pointer-events-none"></div>
                            </div>
                        </template>
                    </div>

                </div>

                <div v-if="showDecompPopup" class="mt-auto w-full bg-slate-50 border-t-4 border-yellow-400 flex flex-col shrink-0 animate-fade-in-up z-20 rounded-b-xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)] overflow-y-auto scrollbar-hide relative max-h-[45%]">
                    
                    <header class="bg-yellow-50/50 border-b border-yellow-100 shrink-0 w-full py-2 sticky top-0 z-30">
                        <div class="max-w-[340px] mx-auto w-full px-3 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-yellow-700 font-black text-[11px] uppercase tracking-widest">Razonamiento</span>
                                <button v-if="decompSuccess" @click="verifyDecompStep" class="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded shadow-sm active:scale-95 transition-all flex items-center justify-center animate-fade-in">
                                    <Check :size="16" stroke-width="4" />
                                </button>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="bg-white px-2 py-0.5 rounded text-xs font-bold text-slate-500 shadow-sm border border-slate-100">Meta: {{ currentTask.hintPart }}</span>
                                <span class="font-black text-xl w-12 text-right transition-colors" :class="[decompSuccess ? 'text-green-600' : 'text-blue-600']">
                                    {{ testQuotient ? decompTotal : '0' }}
                                </span>
                            </div>
                        </div>
                    </header>
                    
                    <div class="p-2 sm:p-3 flex flex-col gap-1.5 max-w-[340px] mx-auto w-full pb-3">
                        <div v-for="(part, index) in decomposedDivisor" :key="index" class="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            <span class="font-black text-slate-500 w-12 text-right text-lg">{{ part }} &times;</span>
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-black transition-colors"
                                 :class="[decompSuccess ? 'bg-green-100 border-2 border-green-400 text-green-600' : 'bg-yellow-100 border border-yellow-400 text-amber-600 ring-2 ring-amber-200 animate-pulse']">
                                {{ testQuotient || '_' }}
                            </div>
                            <span class="font-bold text-slate-400 text-lg">=</span>
                            <span class="font-black text-slate-700 w-12 text-right text-lg">{{ testQuotient ? part * parseInt(testQuotient) : '0' }}</span>
                        </div>

                        <div v-if="!decompSuccess" class="flex flex-col items-center mt-2 pb-1 relative z-10">
                            <button @click="showSmartTip = !showSmartTip" class="flex items-center gap-1.5 text-slate-500 hover:text-amber-600 transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200 text-[10px] font-bold uppercase tracking-wider active:scale-95">
                                <span class="text-base" :class="{'animate-pulse text-amber-500': !showSmartTip}">💡</span> {{ showSmartTip ? 'Ocultar Truco' : 'Ver Truco Ninja' }}
                            </button>
                            
                            <div v-if="showSmartTip" class="mt-2 bg-amber-50/50 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-slate-700 shadow-inner animate-fade-in-up text-left leading-relaxed">
                                <p v-html="smartTipContent"></p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <footer class="shrink-0 w-full bg-white border-t border-slate-200 pb-2 pt-1 rounded-t-[1.5rem] shadow-[0_-5px_15px_rgba(0,0,0,0.05)] relative z-[110]">
        <DecimalKeypad @press="handleKeypress" @delete="handleDelete" />
    </footer>

  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

.animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

.animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-3px, 0, 0); } 40%, 60% { transform: translate3d(3px, 0, 0); } }

.animate-bounce-soft { animation: bounceSoft 1s infinite; }
@keyframes bounceSoft { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(5%); } }

/* ANIMACIÓN DEL CONFETI CSS */
.confetti-piece {
    position: absolute;
    top: -50px;
    font-size: 28px;
    animation: fall linear forwards infinite;
    opacity: 0.9;
}
@keyframes fall {
    to { transform: translateY(100vh) rotate(720deg); }
}

.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>