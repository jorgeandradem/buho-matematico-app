<script setup>
/** * ARCHIVO: TapeCalculator.vue
 * NOTA: v6.1 - Cero advertencias VS Code (CSS nativo). Lógica algebraica blindada.
 * LOGICA: Formato europeo estricto (1.234,56) y exportación limpia.
 */
import { ref, computed, nextTick } from 'vue';
import { jsPDF } from 'jspdf'; 

const emit = defineEmits(['close']);

// --- 🧪 ESTADO DEL MOTOR ---
const currentInput = ref('0');
const runningTotal = ref(0);
const lastOperator = ref(null);
const isFirstEntry = ref(true);
const isResultMode = ref(false); 
const decimalCount = ref(2); 

const tapeHistory = ref([{ id: 0, val: 0, label: 'INICIO', op: '🦉', type: 'start' }]);
const operationCounter = ref(1);
const soundActive = ref(true);
const tapeScroll = ref(null);

const printSound = new Audio('/audios/clip.mp3');

// --- 🛠️ UTILIDADES DE FORMATO (UNIDADES DE MIL CON PUNTO) ---
const formatES = (num) => {
  if (num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimalCount.value,
    maximumFractionDigits: decimalCount.value,
    useGrouping: true 
  }).format(num);
};

const playSound = () => { if (soundActive.value) { printSound.currentTime = 0; printSound.play().catch(() => {}); } };

const calculate = (a, b, op) => {
  const valA = parseFloat(a);
  const valB = parseFloat(b);
  switch (op) {
    case '+': return valA + valB;
    case '-': return valA - valB;
    case '*': return valA * valB;
    case '/': return valB !== 0 ? valA / valB : 0;
    default: return valB;
  }
};

// --- ⚙️ LÓGICA DE OPERACIONES ---
const appendNumber = (num) => {
  if (isResultMode.value || currentInput.value === '0') {
    currentInput.value = num === '.' ? '0.' : num.toString();
    isResultMode.value = false;
  } else {
    if (num === '.' && currentInput.value.includes('.')) return;
    currentInput.value += num.toString();
  }
};

const executeOperator = (op) => {
  const val = parseFloat(currentInput.value);
  if (isNaN(val)) return;

  if (isFirstEntry.value) {
    runningTotal.value = val;
    isFirstEntry.value = false;
  } else if (lastOperator.value) {
    runningTotal.value = calculate(runningTotal.value, val, lastOperator.value);
  }

  tapeHistory.value.push({
    id: operationCounter.value++,
    val: val,
    op: op,
    type: 'entry'
  });

  lastOperator.value = op;
  currentInput.value = '0';
  isResultMode.value = false;
  playSound();
  scrollToBottom();
};

const showEquals = () => {
  const val = parseFloat(currentInput.value);
  if (isNaN(val)) return;

  let result = isFirstEntry.value ? val : calculate(runningTotal.value, val, lastOperator.value || '+');

  tapeHistory.value.push({ id: operationCounter.value++, val: val, op: '=', type: 'entry' });
  tapeHistory.value.push({ type: 'divider' });
  tapeHistory.value.push({ id: operationCounter.value, val: result, op: '=', type: 'result' });

  currentInput.value = result.toString();
  runningTotal.value = result;
  isFirstEntry.value = true;
  lastOperator.value = null;
  isResultMode.value = true;
  
  playSound();
  scrollToBottom();
};

const clearAll = () => {
  currentInput.value = '0'; runningTotal.value = 0; lastOperator.value = null;
  isFirstEntry.value = true; isResultMode.value = false; operationCounter.value = 1;
  tapeHistory.value = [{ id: 0, val: 0, label: 'INICIO', op: '🦉', type: 'start' }];
  playSound();
};

const scrollToBottom = async () => {
  await nextTick();
  if (tapeScroll.value) tapeScroll.value.scrollTop = tapeScroll.value.scrollHeight;
};

// --- 📤 EXPORTACIÓN ---
const exportPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: [80, 250] });
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text("BÚHO MATEMÁTICO", 15, 10);
  doc.text("-----------------------", 10, 15);
  let y = 22;
  tapeHistory.value.forEach(item => {
    if (item.type === 'start') {
      doc.text("INICIO", 10, y);
    }
    else if (item.type === 'divider') doc.text("-----------------------", 10, y);
    else {
      const valStr = formatES(item.val);
      const line = `${item.id.toString().padStart(2, '0')} | ${valStr.padStart(12)} ${item.op}`;
      if (item.type === 'result') doc.setTextColor(0, 0, 255);
      doc.text(line, 10, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 7;
  });
  doc.save('cinta_buho.pdf');
};

const exportTXT = () => {
  const content = tapeHistory.value.map(l => {
    if (l.type === 'start') return `--- | INICIO 🦉`;
    if (l.type === 'divider') return `----------------`;
    return `${l.id.toString().padStart(2, '0')} | ${formatES(l.val).padStart(15)} ${l.op}`;
  }).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'cinta_buho.txt'; a.click();
};
</script>

<template>
  <div class="master-container overflow-hidden">
    <main class="app-canvas font-inter">
      
      <header class="header-standard shrink-0 z-20">
        <div class="header-content-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="header-icon">
            <rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>
          </svg>
          <h1 class="game-title">Cinta de Papel</h1>
        </div>
        <button @click="emit('close')" class="btn-close-calc">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </header>

      <div class="calc-body-wrapper">
        
        <div class="tape-section-container">
          <div class="tape-outer-frame">
            <div ref="tapeScroll" class="tape-inner-paper">
              <div v-for="(line, i) in tapeHistory" :key="i" class="tape-line-row">
                <template v-if="line.type === 'start'">
                  <div class="line-start">
                    <span class="opacity-40">---</span> <span class="start-label">Inicio</span> <span class="text-xl">🦉</span>
                  </div>
                </template>
                <template v-else-if="line.type === 'divider'">
                  <div class="line-divider">=========================</div>
                </template>
                <template v-else>
                  <div :class="['line-entry', line.type === 'result' ? 'line-is-result' : '']">
                    <span class="line-id">{{ line.id.toString().padStart(2, '0') }}</span>
                    <span class="line-val">{{ formatES(line.val) }}</span>
                    <span class="line-op">{{ line.op }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div class="lcd-container">
              <span class="lcd-text">
                {{ formatES(parseFloat(currentInput)) }}
              </span>
            </div>
          </div>
        </div>

        <div class="keypad-grid-container">
          <button @click="clearAll" class="btn-2d btn-danger">Clear</button>
          <button @click="currentInput = currentInput.slice(0,-1) || '0'" class="btn-2d btn-warning">←</button>
          <button @click="currentInput = (parseFloat(currentInput)*-1).toString()" class="btn-2d">±</button>
          <button @click="executeOperator('/')" class="btn-2d btn-action">/</button>

          <button @click="appendNumber(7)" class="btn-2d">7</button>
          <button @click="appendNumber(8)" class="btn-2d">8</button>
          <button @click="appendNumber(9)" class="btn-2d">9</button>
          <button @click="executeOperator('*')" class="btn-2d btn-action">×</button>

          <button @click="appendNumber(4)" class="btn-2d">4</button>
          <button @click="appendNumber(5)" class="btn-2d">5</button>
          <button @click="appendNumber(6)" class="btn-2d">6</button>
          <button @click="executeOperator('-')" class="btn-2d btn-action">-</button>

          <button @click="appendNumber(1)" class="btn-2d">1</button>
          <button @click="appendNumber(2)" class="btn-2d">2</button>
          <button @click="appendNumber(3)" class="btn-2d">3</button>
          <button @click="executeOperator('+')" class="btn-2d btn-action">+</button>

          <button @click="appendNumber(0)" class="btn-2d">0</button>
          <button @click="appendNumber('.')" class="btn-2d">.</button>
          <button @click="showEquals" class="btn-2d btn-total col-span-2">Igual Total (=)</button>
        </div>

        <div class="footer-actions-bar">
          <div class="decimal-selector-box">
            <span class="selector-label">Decimales:</span>
            <select v-model="decimalCount" class="decimal-select">
              <option v-for="n in 6" :key="n-1" :value="n-1">{{ n-1 }}</option>
            </select>
          </div>
          
          <button @click="exportTXT" class="btn-footer-secondary">Guardar TXT</button>
          <button @click="exportPDF" class="btn-footer-primary">Exportar PDF</button>

          <button @click="soundActive = !soundActive" class="btn-sound-toggle">
            <svg v-if="soundActive" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-emerald-500"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-rose-400"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          </button>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.master-container {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f5f9; 
  overflow: hidden;
}

.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #f8fafc;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 1025px) {
  .app-canvas {
    width: 1024px; 
    height: 90dvh;
    border-radius: 45px;
    box-shadow: 0 40px 100px rgba(0,0,0,0.15);
    border: 8px solid white;
    padding: 0; 
  }
}

@media (min-width: 600px) and (max-width: 1024px) {
  .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; padding: 0; }
}

.header-standard {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 2px solid #f1f5f9;
}

.header-content-left { display: flex; align-items: center; gap: 0.5rem; }
.header-icon { color: #1e1b4b; opacity: 0.8; }

.game-title {
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 900;
  color: #312e81;
  text-transform: uppercase;
  font-style: italic; 
  letter-spacing: -0.02em;
}

.btn-close-calc {
  width: 2.5rem; height: 2.5rem; border-radius: 9999px; background-color: #f1f5f9;
  display: flex; align-items: center; justify-content: center; color: #f43f5e;
  transition: all 0.2s; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.calc-body-wrapper {
  flex: 1; display: flex; flex-direction: column; padding: 1rem; min-height: 0; justify-content: space-between; gap: 1rem;
}

@media (min-width: 1025px) { .calc-body-wrapper { padding: 2rem; } }

.tape-section-container { flex: 1; display: flex; flex-direction: column; min-height: 0; max-width: 40rem; margin: 0 auto; width: 100%; }
.tape-outer-frame {
  flex: 1; background-color: rgba(226, 232, 240, 0.5); border-radius: 2.5rem; padding: 0.75rem;
  box-shadow: inset 8px 8px 16px #bcbfc5, inset -8px -8px 16px #ffffff;
  display: flex; flex-direction: column; overflow: hidden; border: 4px solid white;
}

.tape-inner-paper {
  flex: 1; overflow-y: auto; padding: 1.5rem; background-color: #fdfaf1; border-radius: 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.875rem; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background-image: repeating-linear-gradient(#fdfaf1 0px, #fdfaf1 23px, #e5e5e5 24px); line-height: 24px;
}
.tape-inner-paper::-webkit-scrollbar { display: none; }

.tape-line-row { width: 100%; }
.line-start { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 2px solid rgba(0,0,0,0.05); }
.start-label { font-weight: 900; font-style: italic; text-transform: uppercase; font-size: 0.625rem; }
.line-divider { width: 100%; text-align: center; padding: 0.5rem 0; opacity: 0.2; letter-spacing: 0.1em; }
.line-entry { display: flex; align-items: center; padding: 0.375rem 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.line-is-result { color: #1d4ed8; font-weight: 900; background-color: rgba(239, 246, 255, 0.7); margin: 0 -0.75rem; padding: 0.375rem 0.75rem; }
.line-id { width: 2rem; opacity: 0.3; font-size: 0.625rem; font-weight: 700; }
.line-val { flex: 1; text-align: right; padding-right: 1rem; letter-spacing: -0.025em; font-weight: 700; }
.line-op { width: 1rem; text-align: center; font-weight: 900; font-size: 0.75rem; }

.lcd-container {
  margin-top: 1rem; background-color: #b8c2a8; height: 4rem; border-radius: 0.75rem; border: 4px solid #9ba68b;
  box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: flex-end; padding: 0 1.5rem; overflow: hidden; flex-shrink: 0;
}
.lcd-text { font-family: monospace; font-size: 1.875rem; font-weight: 900; color: #2d3128; letter-spacing: -0.05em; }

.keypad-grid-container {
  grid-template-columns: repeat(4, minmax(0, 1fr)); display: grid; gap: 0.5rem; flex-shrink: 0; max-width: 40rem; margin: 0 auto; width: 100%;
}

.btn-2d {
  height: 44px; border-radius: 0.75rem; background-color: #e0e5ec; display: flex; align-items: center; justify-content: center;
  font-size: 1rem; font-weight: 900; color: #475569; transition: all 0.15s; border-bottom: 4px solid #cbd5e1;
}
.btn-2d:active { border-bottom-width: 0; transform: translateY(4px); }
.btn-danger { color: #f43f5e; font-size: 0.75rem; text-transform: uppercase; }
.btn-warning { color: #d97706; font-size: 1.25rem; }
.btn-action { background-color: #eff6ff; color: #2563eb; border-bottom-color: #bfdbfe; font-size: 1.25rem; }
.btn-total { background-color: #10b981; color: white; border-bottom-color: #059669; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
.col-span-2 { grid-column: span 2 / span 2; }

.footer-actions-bar {
  display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; height: 3rem; background-color: rgba(255,255,255,0.3);
  border-radius: 1rem; padding: 0 0.75rem; max-width: 40rem; margin: 0 auto; width: 100%; border: 2px solid rgba(255,255,255,0.5);
}

.decimal-selector-box {
  display: flex; align-items: center; gap: 0.5rem; background-color: rgba(226, 232, 240, 0.8); border-radius: 0.75rem;
  padding: 0 0.75rem; height: 100%; border: 1px solid white;
}
.selector-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; }
.decimal-select { background-color: transparent; font-size: 11px; font-weight: 900; color: #334155; outline: none; cursor: pointer; border: none; }

.btn-footer-secondary {
  flex: 1; background-color: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 10px; font-weight: 900;
  color: #64748b; height: 100%; text-transform: uppercase; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-footer-secondary:active { transform: scale(0.95); }

.btn-footer-primary {
  flex: 1; background-color: #2563eb; border-radius: 0.75rem; font-size: 10px; font-weight: 900;
  color: white; height: 100%; text-transform: uppercase; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); border: 2px solid #60a5fa;
}
.btn-footer-primary:active { transform: scale(0.95); }

.btn-sound-toggle {
  width: 2.5rem; height: 100%; background-color: #f1f5f9; border-radius: 0.75rem; display: flex; align-items: center;
  justify-content: center; border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
</style>