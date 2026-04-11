<script setup>
/** * ARCHIVO: TapeCalculator.vue
 * VERSION: 8.9 - Integración de Header Estándar de Suite.
 * NOTA: Título "Cinta de Papel" sin negrilla (font-medium) por Jorge.
 * LOGICA: Sumadora + Algebraica (v7.7). Alineación Derecha.
 */
import { ref, computed, nextTick } from 'vue';
import { 
  Calculator, List, RotateCcw, Printer, FileDown 
} from 'lucide-vue-next';
import { jsPDF } from 'jspdf'; 

const emit = defineEmits(['close']);

// --- 🧪 ESTADO DEL MOTOR (INTACTO) ---
const currentInput = ref('0');
const runningTotal = ref(0);
const pendingValue = ref(null);
const pendingOp = ref(null);
const lastEntry = ref(0);
const isResultMode = ref(false); 
const decimalCount = ref(2); 

// --- ✨ EFECTOS VISUALES (INTACTOS) ---
const isFeeding = ref(false); 
const tapeHistory = ref([{ id: 0, val: 0, label: 'INICIO', op: '🦉', type: 'start' }]);
const operationCounter = ref(1);
const soundActive = ref(true);
const tapeScroll = ref(null);

const printSound = new Audio('/audios/clip.mp3');

// --- 🛠️ UTILIDADES (INTACTAS) ---
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

// --- ⚙️ LÓGICA DE OPERACIONES (INTACTA) ---
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

const exportTXT = () => {
  const content = tapeHistory.value.map(l => {
    if (l.type === 'start') return `--- | INICIO`;
    if (l.type === 'divider') return `----------------`;
    const valStr = formatES(l.val).padStart(15);
    return `${(l.id || 0).toString().padStart(2, '0')} | ${valStr} ${l.op === '🦉' ? '' : l.op}`;
  }).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'cinta_buho.txt'; a.click();
};

const exportPDF = () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont("courier", "bold"); doc.setFontSize(11);
  doc.text("BÚHO MATEMÁTICO - REPORTE", 15, 15);
  let y = 30;
  tapeHistory.value.forEach(item => {
    if (y > 270) { doc.addPage(); y = 30; }
    if (item.type === 'divider') doc.text("-----------------------------------", 15, y);
    else {
      const cleanOp = item.op === '🦉' ? '' : (item.op || '');
      const line = `${(item.id || 0).toString().padStart(2, '0')} | ${formatES(item.val).padStart(15)} ${cleanOp}`;
      if (item.type === 'result') doc.setTextColor(0, 0, 255);
      doc.text(line, 15, y); doc.setTextColor(0, 0, 0);
    }
    y += 7;
  });
  doc.save('cinta_buho.pdf');
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas bg-slate-50">
      
      <header class="header-standard shrink-0 relative flex justify-between items-center py-2 sm:py-3 px-4 sm:px-6 shadow-sm z-30 bg-white">
        <div class="w-8 h-8 sm:w-10 sm:h-10 invisible hidden md:block"></div>
        <div class="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Calculator size="18" stroke-width="2.5" />
            </div>
            <span class="text-[#312e81] font-medium text-[15px] sm:text-xl uppercase tracking-widest leading-none font-numbers italic text-shadow-sm mt-0.5 truncate">
              Cinta de Papel
            </span>
        </div>
        <button @click="emit('close')" class="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white border-2 border-slate-200 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </header>

      <div class="flex-1 flex flex-col items-center overflow-hidden relative">
        <div class="calculator-main-frame">
          <div class="calc-internal-body-lifted">
            
            <div class="tape-section-reduced">
              <div :class="['printer-slot-ui', { 'is-latente': isFeeding }]"></div>
              <div class="tape-viewport-compact shadow-25d-inset">
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

            <div class="visor-area-compact shrink-0">
              <div class="lcd-frame-compact shadow-25d-inset">
                <span class="lcd-text-pro">{{ formatES(parseFloat(currentInput)) }}</span>
              </div>

              <div class="crystal-subtotal-box shadow-25d-inset">
                <div class="t-legend">T: <span class="t-desc">Saldo ◊</span></div>
                <div class="t-value">{{ formatES(runningTotal) }}</div>
              </div>
            </div>

            <div class="keypad-layout-xl shrink-0">
              <button @click="clearAll" class="btn-2d-xl btn-orange">C</button>
              <button @click="currentInput = currentInput.slice(0,-1) || '0'" class="btn-2d-xl btn-orange">←</button>
              <button @click="currentInput = (parseFloat(currentInput)*-1).toString()" class="btn-2d-xl btn-orange">±</button>
              <button @click="handleOperator('÷')" class="btn-2d-xl btn-blue-3d">÷</button>

              <button @click="appendNumber(7)" class="btn-2d-xl">7</button>
              <button @click="appendNumber(8)" class="btn-2d-xl">8</button>
              <button @click="appendNumber(9)" class="btn-2d-xl">9</button>
              <button @click="handleOperator('×')" class="btn-2d-xl btn-blue-3d">×</button>

              <button @click="appendNumber(4)" class="btn-2d-xl">4</button>
              <button @click="appendNumber(5)" class="btn-2d-xl">5</button>
              <button @click="appendNumber(6)" class="btn-2d-xl">6</button>
              <button @click="handleOperator('-')" class="btn-2d-xl btn-blue-3d">-</button>

              <button @click="appendNumber(1)" class="btn-2d-xl">1</button>
              <button @click="appendNumber(2)" class="btn-2d-xl">2</button>
              <button @click="appendNumber(3)" class="btn-2d-xl">3</button>
              <button @click="handleOperator('+')" class="btn-2d-xl btn-blue-3d">+</button>

              <button @click="appendNumber(0)" class="btn-2d-xl">0</button>
              <button @click="appendNumber('.')" class="btn-2d-xl">.</button>
              <button @click="showTotal" class="btn-2d-xl btn-total-equal">TOTAL (*)</button>
            </div>

            <footer class="footer-lifted shrink-0">
              <div class="dec-pill shadow-25d-inset">
                <span class="d-label">Dec:</span>
                <select v-model="decimalCount" class="d-select">
                  <option v-for="n in 6" :key="n-1" :value="n-1">{{ n-1 }}</option>
                </select>
              </div>
              <button @click="exportTXT" class="btn-f btn-txt-highlight">TXT</button>
              <button @click="exportPDF" class="btn-f btn-pdf-pastel">A4 PDF</button>
              
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
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Nunito:ital,wght@1,800&display=swap');
.font-inter { font-family: 'Inter', sans-serif; }
.font-numbers { font-family: 'Nunito', sans-serif; }
.text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #f1f5f9; overflow: hidden; }
.app-canvas { display: flex; flex-direction: column; background-color: #f8fafc; transition: all 0.4s; width: 100vw; height: 100dvh; overflow: hidden; }

@media (min-width: 1025px) { 
  .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15); } 
}

.calculator-main-frame {
  width: 100%; height: 100%; max-width: 440px; margin: 0 auto;
  background: white; display: flex; flex-direction: column; position: relative; overflow: hidden;
  padding-bottom: 1.5rem;
}

.calc-internal-body-lifted { flex: 1; display: flex; flex-direction: column; padding: 0.5rem 1rem 0; min-height: 0; justify-content: space-between; overflow: hidden; }

/* 📜 CINTA */
.tape-section-reduced { height: 16vh; min-height: 110px; display: flex; flex-direction: column; overflow: hidden; margin-bottom: 0.4rem; }
.printer-slot-ui { width: 65%; height: 8px; background: #334155; border-radius: 10px; z-index: 10; margin-bottom: -4px; margin: 0 auto; transition: background-color 0.3s; }
@keyframes yellow-glow { 0% { background-color: #334155; } 50% { background-color: #fef08a; box-shadow: 0 0 15px #fef08a; } 100% { background-color: #334155; } }
.is-latente { animation: yellow-glow 0.6s ease-in-out; }

.tape-viewport-compact { flex: 1; width: 100%; display: flex; flex-direction: column; overflow: hidden; border-radius: 1.5rem; border: 4px solid white; background: #fdfaf1; }
.paper-content { flex: 1; overflow-y: auto; padding: 0.8rem 1rem; background-image: repeating-linear-gradient(#fdfaf1 0px, #fdfaf1 23px, #e5e5e5 24px); line-height: 24px; }

.row-start { display: flex; justify-content: space-between; font-weight: 900; color: #475569; border-bottom: 2px solid #e2e8f0; margin-bottom: 4px; }
.row-divider { color: #cbd5e1; text-align: center; letter-spacing: 2px; }
.row-entry { display: flex; align-items: center; padding: 0.1rem 0; border-bottom: 1px solid rgba(0,0,0,0.02); width: 100%; }
.is-soft-gray { color: #94a3b8; font-weight: 600; }
.is-final { color: #1d4ed8; font-weight: 900; background: rgba(239,246,255,0.7); margin: 0 -0.5rem; padding: 0.15rem 0.5rem; }
.r-id-high { width: 1.8rem; font-weight: 900; font-size: 0.7rem; text-align: left; color: #475569; opacity: 0.8; flex-shrink: 0; }
.r-val { flex: 1; text-align: right; padding-right: 0.6rem; font-weight: 700; }
.r-op { width: 1rem; text-align: center; font-weight: 900; }

/* VISORES */
.lcd-frame-compact { background-color: #b8c2a8; height: 3.5rem; border-radius: 0.75rem; border: 3px solid #9ba68b; display: flex; align-items: center; justify-content: flex-end; padding: 0 1.2rem; }
.lcd-text-pro { font-family: monospace; font-size: 2.2rem; font-weight: 900; color: #2d3128; letter-spacing: -0.05em; }
.crystal-subtotal-box { height: 2.2rem; border-radius: 0.7rem; background: rgba(37, 99, 235, 0.08); border: 2px solid rgba(255, 255, 255, 0.5); display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; margin-top: 0.4rem; backdrop-filter: blur(10px); }
.t-value { font-family: monospace; font-weight: 900; color: #1e3a8a; font-size: 1.3rem; }

/* TECLADO */
.keypad-layout-xl { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; width: 100%; margin-top: 0.5rem; }
.btn-2d-xl { height: 65px; border-radius: 0.8rem; background-color: #f8fafc; border: none; font-size: 1.45rem; font-weight: 900; color: #475569; transition: all 0.1s; border-bottom: 5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.btn-2d-xl:active { border-bottom-width: 0; transform: translateY(5px); }

.btn-orange { color: #f97316; background-color: #fff7ed; border-bottom-color: #fed7aa; }
.btn-blue-3d { color: #ffffff; background-color: #2563eb; border-bottom: 5px solid #1e3a8a; font-size: 1.8rem; }
.btn-total-equal { grid-column: span 2; background-color: #10b981; color: white; border-bottom-color: #059669; font-size: 1rem; }

/* FOOTER */
.footer-lifted { display: flex; align-items: center; gap: 0.4rem; height: 3.2rem; background: rgba(255,255,255,0.2); border-radius: 1rem; padding: 0 0.5rem; border: 1px solid rgba(255,255,255,0.4); margin-top: 0.6rem; margin-bottom: 0.5rem; }
.dec-pill { display: flex; align-items: center; gap: 0.2rem; background: #e2e8f0; padding: 0 0.4rem; border-radius: 0.6rem; height: 2.2rem; border: 1px solid white; }
.d-label { font-size: 10px; font-weight: 900; color: #475569; }
.d-select { background: transparent; border: none; font-weight: 900; font-size: 12px; color: #1e3a8a; cursor: pointer; outline: none; }
.btn-f { flex: 1; height: 2.2rem; border-radius: 0.6rem; font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.1s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.btn-txt-highlight { background: linear-gradient(145deg, #fde047, #eab308) !important; color: #854d0e !important; border-bottom: 4px solid #a16207 !important; }
.btn-pdf-pastel { background-color: #dbeafe !important; color: #2563eb !important; border-bottom: 4px solid #93c5fd !important; }
.btn-f-audio { width: 2.8rem; height: 2.2rem; background: #f1f5f9; border-radius: 0.75rem; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.shadow-25d-inset { box-shadow: inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.7); }
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>