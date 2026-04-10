<script setup>
/** * ARCHIVO: TapeCalculator.vue
 * VERSION: 8.3 - Reporte Doble Columna (A4 Optimizado).
 * NOTA: Divisor vertical en PDF, Botón PDF Azul Pastel 3D, Header Compacto.
 * LOGICA: Sumadora + Algebraica (v7.7). Alineación Derecha.
 */
import { ref, computed, nextTick } from 'vue';
import { jsPDF } from 'jspdf'; 

const emit = defineEmits(['close']);

// --- 🧪 ESTADO DEL MOTOR ---
const currentInput = ref('0');
const runningTotal = ref(0);
const pendingValue = ref(null);
const pendingOp = ref(null);
const lastEntry = ref(0);
const isResultMode = ref(false); 
const decimalCount = ref(2); 

// --- ✨ EFECTOS VISUALES ---
const isFeeding = ref(false); 

const tapeHistory = ref([{ id: 0, val: 0, label: 'INICIO', op: '🦉', type: 'start' }]);
const operationCounter = ref(1);
const soundActive = ref(true);
const tapeScroll = ref(null);

const printSound = new Audio('/audios/clip.mp3');

// --- 🛠️ UTILIDADES ---
const formatES = (num) => {
  if (num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimalCount.value,
    maximumFractionDigits: decimalCount.value,
    useGrouping: true 
  }).format(num);
};

const triggerEffect = () => {
  isFeeding.value = true;
  setTimeout(() => { isFeeding.value = false; }, 600);
};

const playSound = () => { if (soundActive.value) { printSound.currentTime = 0; printSound.play().catch(() => {}); } };

const scrollToBottom = async () => {
  await nextTick();
  if (tapeScroll.value) tapeScroll.value.scrollTop = tapeScroll.value.scrollHeight;
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

const handleOperator = (op) => {
  const val = parseFloat(currentInput.value);
  if (op === '×' || op === '÷') {
    pendingValue.value = val;
    pendingOp.value = op === '×' ? '*' : '/';
    tapeHistory.value.push({ id: operationCounter.value++, val: val, op: op, type: 'entry' });
  } else {
    let finalVal = val;
    if (val === 0 && !isResultMode.value) finalVal = lastEntry.value;
    if (op === '+') runningTotal.value += finalVal;
    if (op === '-') runningTotal.value -= finalVal;
    lastEntry.value = finalVal;
    tapeHistory.value.push({ id: operationCounter.value++, val: finalVal, op: op, type: 'entry' });
  }
  currentInput.value = '0';
  playSound();
  triggerEffect();
  scrollToBottom();
};

const showTotal = () => {
  const val = parseFloat(currentInput.value);
  let finalResult = 0;
  if (pendingOp.value && pendingValue.value !== null) {
    if (pendingOp.value === '*') finalResult = pendingValue.value * val;
    if (pendingOp.value === '/') finalResult = val !== 0 ? pendingValue.value / val : 0;
    tapeHistory.value.push({ id: operationCounter.value++, val: val, op: '=', type: 'entry' });
  } else {
    if (val !== 0 && !isResultMode.value) {
      runningTotal.value += val;
      tapeHistory.value.push({ id: operationCounter.value++, val: val, op: '+', type: 'entry' });
    }
    finalResult = runningTotal.value;
  }
  tapeHistory.value.push({ type: 'divider' });
  tapeHistory.value.push({ id: operationCounter.value++, val: finalResult, op: '*', type: 'result' });
  currentInput.value = finalResult.toString();
  runningTotal.value = 0;
  pendingValue.value = null;
  pendingOp.value = null;
  lastEntry.value = 0;
  isResultMode.value = true;
  playSound();
  triggerEffect();
  scrollToBottom();
};

const clearAll = () => {
  currentInput.value = '0';
  runningTotal.value = 0;
  lastEntry.value = 0;
  pendingOp.value = null;
  pendingValue.value = null;
  isResultMode.value = false;
  operationCounter.value = 1;
  tapeHistory.value = [{ id: 0, val: 0, label: 'INICIO', op: '🦉', type: 'start' }];
  playSound();
};

// --- 📤 EXPORTACIONES (DOBLE COLUMNA) ---

const exportTXT = () => {
  const history = tapeHistory.value;
  const mid = Math.ceil(history.length / 2);
  let content = "BÚHO MATEMÁTICO - REPORTE TXT\n";
  content += "COLUMNA 1              | COLUMNA 2\n";
  content += "-----------------------------------------------\n";

  for (let i = 0; i < mid; i++) {
    const left = history[i];
    const right = history[i + mid];

    const formatLine = (item) => {
      if (!item) return "".padEnd(22);
      if (item.type === 'start') return "--- | INICIO".padEnd(22);
      if (item.type === 'divider') return "----------------".padEnd(22);
      const valStr = formatES(item.val).padStart(12);
      const idStr = (item.id || 0).toString().padStart(2, '0');
      const opStr = item.op === '🦉' ? '' : (item.op || '');
      return `${idStr} | ${valStr} ${opStr}`.padEnd(22);
    };

    content += `${formatLine(left)} | ${formatLine(right)}\n`;
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'cinta_buho_columnas.txt'; a.click();
};

const exportPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.height;
  const col1X = 15;
  const col2X = 115;
  let currentX = col1X;
  let y = 30;
  let column = 1;

  doc.setFont("courier", "bold"); doc.setFontSize(11);
  doc.text("BÚHO MATEMÁTICO - REPORTE A4", 15, 15);
  
  // Línea divisoria vertical inicial
  doc.setDrawColor(200);
  doc.line(105, 25, 105, pageHeight - 15);

  tapeHistory.value.forEach(item => {
    // Si llegamos al final de la página
    if (y > pageHeight - 20) {
      if (column === 1) {
        column = 2;
        currentX = col2X;
        y = 30;
      } else {
        doc.addPage();
        column = 1;
        currentX = col1X;
        y = 30;
        doc.line(105, 25, 105, pageHeight - 15);
      }
    }

    if (item.type === 'start') {
      doc.text("--- | INICIO", currentX, y);
    } else if (item.type === 'divider') {
      doc.text("--------------------", currentX, y);
    } else {
      const cleanOp = item.op === '🦉' ? '' : (item.op || '');
      const line = `${(item.id || 0).toString().padStart(2, '0')} | ${formatES(item.val).padStart(12)} ${cleanOp}`;
      if (item.type === 'result') doc.setTextColor(0, 0, 255);
      doc.text(line, currentX, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 7;
  });

  doc.save('cinta_buho_columnas.pdf');
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas font-inter">
      
      <div class="silver-phone-chassis">
        
        <header class="header-standard-compact">
          <div class="brand-group-line">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="3" class="icon-header">
              <rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>
            </svg>
            <h1 class="game-title-line">Cinta de Papel</h1>
          </div>
          <button @click="emit('close')" class="btn-exit-simple">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </header>

        <div class="calc-internal-body-optimized">
          
          <div class="tape-section-top flex-1">
            <div :class="['printer-slot-ui', { 'is-latente': isFeeding }]"></div>
            
            <div class="tape-viewport shadow-25d-inset">
              <div ref="tapeScroll" class="paper-content scroll-smooth no-scrollbar">
                <div v-for="(line, i) in tapeHistory" :key="i" class="paper-line">
                  <template v-if="line.type === 'start'">
                    <div class="row-start"><span>INICIO</span> <span>🦉</span></div>
                  </template>
                  <template v-else-if="line.type === 'divider'">
                    <div class="row-divider">======================</div>
                  </template>
                  <template v-else>
                    <div :class="['row-entry', line.type === 'result' ? 'is-final' : 'is-soft-gray']">
                      <span class="r-id-high">{{ line.id.toString().padStart(2, '0') }}</span>
                      <span class="r-val">{{ formatES(line.val) }}</span>
                      <span class="r-op">{{ line.op }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="lcd-frame-compact shrink-0 shadow-25d-inset">
            <span class="lcd-text-pro">{{ formatES(parseFloat(currentInput)) }}</span>
          </div>

          <div class="crystal-subtotal-box shrink-0 shadow-25d-inset">
            <div class="t-legend">T: <span class="t-desc">Saldo ◊</span></div>
            <div class="t-value">{{ formatES(runningTotal) }}</div>
          </div>

          <div class="keypad-layout shrink-0">
            <button @click="clearAll" class="btn-2d btn-orange">C</button>
            <button @click="currentInput = currentInput.slice(0,-1) || '0'" class="btn-2d btn-orange">←</button>
            <button @click="currentInput = (parseFloat(currentInput)*-1).toString()" class="btn-2d btn-orange">±</button>
            <button @click="handleOperator('÷')" class="btn-2d btn-blue-3d">÷</button>

            <button @click="appendNumber(7)" class="btn-2d">7</button>
            <button @click="appendNumber(8)" class="btn-2d">8</button>
            <button @click="appendNumber(9)" class="btn-2d">9</button>
            <button @click="handleOperator('×')" class="btn-2d btn-blue-3d">×</button>

            <button @click="appendNumber(4)" class="btn-2d">4</button>
            <button @click="appendNumber(5)" class="btn-2d">5</button>
            <button @click="appendNumber(6)" class="btn-2d">6</button>
            <button @click="handleOperator('-')" class="btn-2d btn-blue-3d">-</button>

            <button @click="appendNumber(1)" class="btn-2d">1</button>
            <button @click="appendNumber(2)" class="btn-2d">2</button>
            <button @click="appendNumber(3)" class="btn-2d">3</button>
            <button @click="handleOperator('+')" class="btn-2d btn-blue-3d">+</button>

            <button @click="appendNumber(0)" class="btn-2d">0</button>
            <button @click="appendNumber('.')" class="btn-2d">.</button>
            <button @click="showTotal" class="btn-2d btn-total-equal">TOTAL (*)</button>
          </div>

          <footer class="footer-actions-lifted shrink-0">
            <div class="dec-selector shadow-25d-inset">
              <span class="d-label">Dec:</span>
              <select v-model="decimalCount" class="d-select">
                <option v-for="n in 6" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
            </div>
            <button @click="exportTXT" class="btn-f-pill btn-txt-highlight">TXT</button>
            
            <button @click="exportPDF" class="btn-f-pill btn-pdf-pastel">A4 PDF</button>
            
            <button @click="soundActive = !soundActive" class="btn-f-audio">
              <svg v-if="soundActive" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            </button>
          </footer>

        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s; width: 100vw; height: 100dvh; overflow: hidden; }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15); } }

/* 📱 CARCASA PLATEADA/NEGRA 2.5D */
.silver-phone-chassis {
  width: 100%; height: 100%; max-width: 440px; margin: 0 auto;
  background: linear-gradient(145deg, #e2e8f0, #ffffff);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
  border-top: 4px solid #1a1a1a;
  border-bottom: 4px solid #1a1a1a;
  border-left: 2px solid #334155;
  border-right: 2px solid #334155;
}

@media (min-width: 600px) {
  .silver-phone-chassis { 
    border-radius: 45px; border: none;
    box-shadow: 0 0 0 2px #1a1a1a, 0 0 0 12px #cbd5e1, inset 2px 2px 8px #fff, 15px 30px 60px rgba(0,0,0,0.25);
  }
}

.header-standard-compact { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; padding: 0.7rem 1.2rem 0.3rem; background: white; border-bottom: 2px solid #f1f5f9; }
.brand-group-line { display: flex; align-items: center; gap: 0.5rem; }
.game-title-line { font-size: 1.2rem; font-weight: 900; color: #1e1b4b; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; }
.btn-exit-simple { width: 2rem; height: 2rem; border-radius: 50%; background: #f8fafc; border: 2px solid white; box-shadow: 2px 2px 5px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; color: #f43f5e; cursor: pointer; }

.calc-internal-body-optimized { flex: 1; display: flex; flex-direction: column; padding: 0.4rem 0.8rem 0.6rem; min-height: 0; justify-content: space-between; overflow: hidden; }
.tape-section-top { display: flex; flex-direction: column; overflow: hidden; margin-bottom: 0.2rem; }
.printer-slot-ui { width: 65%; height: 10px; background: #334155; border-radius: 10px; z-index: 10; margin-bottom: -5px; margin: 0 auto; transition: background-color 0.3s; }
@keyframes yellow-glow { 0% { background-color: #334155; } 50% { background-color: #fef08a; box-shadow: 0 0 15px #fef08a; } 100% { background-color: #334155; } }
.is-latente { animation: yellow-glow 0.6s ease-in-out; }

.tape-viewport { flex: 1; width: 100%; display: flex; flex-direction: column; overflow: hidden; border-radius: 1.8rem; border: 4px solid white; background: #fdfaf1; }
.paper-content { flex: 1; overflow-y: auto; padding: 0.8rem 1.2rem; background-image: repeating-linear-gradient(#fdfaf1 0px, #fdfaf1 23px, #e5e5e5 24px); line-height: 24px; }
.row-entry { display: flex; align-items: center; padding: 0.1rem 0; border-bottom: 1px solid rgba(0,0,0,0.02); width: 100%; }
.is-soft-gray { color: #94a3b8; font-weight: 600; }
.is-final { color: #1d4ed8; font-weight: 900; background: rgba(239,246,255,0.7); margin: 0 -0.5rem; padding: 0.15rem 0.5rem; }
.r-id-high { width: 1.8rem; font-weight: 900; font-size: 0.7rem; text-align: left; color: #475569; opacity: 0.8; flex-shrink: 0; }
.r-val { flex: 1; text-align: right; padding-right: 0.6rem; font-weight: 700; }
.r-op { width: 1rem; text-align: center; font-weight: 900; }

.lcd-frame-compact { background-color: #b8c2a8; height: 3rem; border-radius: 0.75rem; border: 3px solid #9ba68b; display: flex; align-items: center; justify-content: flex-end; padding: 0 1.2rem; }
.lcd-text-pro { font-family: monospace; font-size: 1.8rem; font-weight: 900; color: #2d3128; letter-spacing: -0.05em; }

.crystal-subtotal-box { height: 2rem; border-radius: 0.7rem; background: rgba(37, 99, 235, 0.08); border: 2px solid rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; margin-top: 0.3rem; backdrop-filter: blur(10px); }
.t-value { font-family: monospace; font-weight: 900; color: #1e3a8a; font-size: 1.15rem; }

.keypad-layout { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem; width: 100%; margin-top: 0.4rem; }
.btn-2d { height: 38px; border-radius: 0.7rem; background-color: #f8fafc; border: none; font-size: 1.1rem; font-weight: 900; color: #475569; transition: all 0.1s; border-bottom: 4px solid #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn-2d:active { border-bottom-width: 0; transform: translateY(4px); }

.btn-orange { color: #f97316; background-color: #fff7ed; border-bottom-color: #fed7aa; }
.btn-blue-3d { color: #ffffff; background-color: #2563eb; border-bottom: 5px solid #1e3a8a; font-size: 1.4rem; }
.btn-total-equal { grid-column: span 2; background-color: #10b981; color: white; border-bottom-color: #059669; font-size: 0.75rem; }
.btn-txt-highlight { background: linear-gradient(145deg, #fde047, #eab308) !important; color: #854d0e !important; border-bottom-color: #a16207 !important; }

/* 🔴 BOTÓN PDF AZUL PASTEL 3D JORGE */
.btn-pdf-pastel {
  background-color: #dbeafe !important;
  color: #2563eb !important;
  border-bottom: 4px solid #93c5fd !important;
}
.btn-pdf-pastel:active { border-bottom: 0 !important; transform: translateY(4px); }

.footer-actions-lifted { display: flex; align-items: center; gap: 0.4rem; height: 2.8rem; background: rgba(255,255,255,0.2); border-radius: 1rem; padding: 0 0.5rem; border: 1px solid rgba(255,255,255,0.4); margin-top: 0.3rem; }
.dec-selector { display: flex; align-items: center; gap: 0.2rem; background: #e2e8f0; padding: 0 0.4rem; border-radius: 0.6rem; height: 1.8rem; border: 1px solid white; }
.btn-f-pill { flex: 1; height: 1.8rem; border-radius: 0.6rem; font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
.btn-f-audio { width: 2.2rem; height: 1.8rem; background: #f1f5f9; border-radius: 0.75rem; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.shadow-25d-inset { box-shadow: inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.7); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>