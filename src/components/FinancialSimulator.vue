<script setup>
/** * ARCHIVO: FinancialSimulator.vue
 * VERSION: 2.6 - Fix de ejecución PDF y Proporciones de Columna.
 * NOTA: Corrección de importación para jspdf-autotable y anchos A4 para Jorge.
 */
import { ref, computed, watch } from 'vue';
import { 
  Calculator, CalendarDays, Percent, PieChart, 
  List, Euro, RotateCcw, Printer, FileDown 
} from 'lucide-vue-next';

// --- 📦 LIBRERÍAS DE EXPORTACIÓN ---
import { domToJpeg } from 'modern-screenshot'; 
import jsPDF from 'jspdf';                   
import autoTable from 'jspdf-autotable'; // Importación directa corregida

const emit = defineEmits(['close']);

// --- 🧪 ESTADO DEL MOTOR ---
const amountRaw = ref(''); 
const years = ref('');
const months = ref('');
const interestRateRaw = ref(''); 

// --- 🎯 REFERENCIAS ---
const inputAmount = ref(null);
const inputYears = ref(null);
const inputMonths = ref(null);
const inputInterest = ref(null);
const captureArea = ref(null); 

// --- 🧭 NAVEGACIÓN INTERNA ---
const activeTab = ref('summary'); 

// --- 🧹 SISTEMA DE REINICIO ---
const resetSimulator = () => {
  amountRaw.value = '';
  years.value = '';
  months.value = '';
  interestRateRaw.value = '';
  activeTab.value = 'summary';
  
  setTimeout(() => {
    if (inputAmount.value) inputAmount.value.focus();
  }, 50);
};

const handleClose = () => {
  resetSimulator(); 
  emit('close');
};

// --- 🧩 LÓGICA DE EXCLUSIÓN MUTUA ---
watch(years, (newVal) => {
  if (newVal !== '' && newVal !== null) {
    months.value = ''; 
  }
});
watch(months, (newVal) => {
  if (newVal !== '' && newVal !== null) {
    years.value = ''; 
  }
});

// --- 🧩 FILTROS DE ENTRADA ---
const handleAmountInput = (event) => {
  let rawValue = event.target.value.replace(/\D/g, '');
  if (!rawValue) {
    amountRaw.value = '';
    return;
  }
  const num = parseInt(rawValue, 10);
  amountRaw.value = new Intl.NumberFormat('es-ES', { 
    maximumFractionDigits: 0 
  }).format(num);
};

const handleInterestInput = (event) => {
  let val = event.target.value.replace('.', ',');
  val = val.replace(/[^0-9,]/g, '');
  const parts = val.split(',');
  if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('');
  if (parts[1] !== undefined && parts[1].length > 2) val = parts[0] + ',' + parts[1].substring(0, 2);
  interestRateRaw.value = val;
};

// --- 🧮 MOTOR FINANCIERO ---
const parsedAmount = computed(() => {
  return parseFloat(amountRaw.value.replace(/\./g, '')) || 0;
});

const totalMonths = computed(() => {
  const y = parseInt(years.value) || 0;
  const m = parseInt(months.value) || 0;
  return (y * 12) + m;
});

const monthlyRate = computed(() => {
  const rateStr = interestRateRaw.value.replace(',', '.');
  const rate = parseFloat(rateStr) || 0;
  return (rate / 100) / 12;
});

const calculations = computed(() => {
  const p = parsedAmount.value;
  const r = monthlyRate.value;
  const n = totalMonths.value;
  if (p <= 0 || n <= 0) return { payment: 0, totalInterest: 0, totalAmount: 0, principalPct: 50, interestPct: 50 };
  let pmt = r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n));
  const totalAmt = pmt * n;
  const totalInt = totalAmt - p;
  return {
    payment: pmt,
    totalInterest: totalInt,
    totalAmount: totalAmt,
    interestPct: totalAmt > 0 ? (totalInt / totalAmt) * 100 : 0,
    principalPct: totalAmt > 0 ? (p / totalAmt) * 100 : 0
  };
});

const amortizationSchedule = computed(() => {
  const schedule = [];
  let balance = parsedAmount.value;
  const r = monthlyRate.value;
  const pmt = calculations.value.payment;
  const n = totalMonths.value;
  if (balance <= 0 || n <= 0) return schedule;
  for (let i = 1; i <= n; i++) {
    const interestForMonth = balance * r;
    let principalForMonth = pmt - interestForMonth;
    if (i === n) principalForMonth = balance;
    balance -= principalForMonth;
    schedule.push({
      month: i,
      payment: principalForMonth + interestForMonth,
      principal: principalForMonth,
      interest: interestForMonth,
      balance: Math.max(0, balance)
    });
  }
  return schedule;
});

// --- 🎨 FORMATEADORES ---
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(val);
};

const pieChartStyle = computed(() => {
  const intPct = calculations.value.interestPct.toFixed(1);
  return {
    background: `conic-gradient(#10b981 0% ${intPct}%, #3b82f6 ${intPct}% 100%)`
  };
});

// --- 📤 MOTOR DE EXPORTACIÓN JORGE ---

const exportJPG = async () => {
  if (!captureArea.value) return;
  try {
    const dataUrl = await domToJpeg(captureArea.value, {
      quality: 0.95,
      scale: 2,
      backgroundColor: '#f8fafc'
    });
    const link = document.createElement('a');
    link.download = `Simulacion_Financiera.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (err) { console.error("Error JPG:", err); }
};

const exportPDF = () => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("REPORTE DE AMORTIZACIÓN", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Préstamo: ${formatCurrency(parsedAmount.value)} | Interés: ${interestRateRaw.value}% | Plazo: ${totalMonths.value} meses`, 14, 28);

    const tableRows = amortizationSchedule.value.map(row => [
      row.month,
      formatCurrency(row.principal),
      formatCurrency(row.interest),
      formatCurrency(row.balance)
    ]);

    // Llamada directa corregida para evitar errores de ejecución
    autoTable(doc, {
      startY: 35,
      head: [['MES', 'CAPITAL', 'INTERÉS', 'BALANCE']],
      body: tableRows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 41, 59], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // MES: Estrecho
        1: { cellWidth: 'auto', halign: 'right', textColor: [37, 99, 235] }, // CAPITAL
        2: { cellWidth: 'auto', halign: 'right', textColor: [16, 185, 129] }, // INTERÉS
        3: { cellWidth: 65, halign: 'right', fontStyle: 'bold' } // BALANCE: Prioritario (ancho asignado)
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Pie de página con numeración
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber}`, 14, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Reporte_Financiero_A4.pdf`);
  } catch (err) {
    console.error("Error al generar PDF:", err);
    alert("Hubo un problema al generar el PDF. Revisa la consola.");
  }
};
</script>

<template>
  <div class="master-container font-inter">
    <main class="app-canvas bg-slate-50">
      
      <header class="header-standard shrink-0 relative flex justify-between items-center py-2 sm:py-3 px-4 sm:px-6 shadow-sm z-30">
        <div class="w-8 h-8 sm:w-10 sm:h-10 invisible hidden md:block"></div>
        <div class="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Calculator size="18" stroke-width="2.5" />
            </div>
            <span class="text-[#312e81] font-black text-[15px] sm:text-xl uppercase tracking-widest leading-none font-numbers italic text-shadow-sm mt-0.5 truncate">
              Simulador Financiero
            </span>
        </div>
        <button @click="handleClose" class="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white border-2 border-slate-200 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </header>

      <div class="flex-1 flex flex-col w-full overflow-hidden relative">
        
        <div class="flex p-1.5 bg-slate-100 shrink-0 border-b border-slate-200">
            <button @click="activeTab = 'summary'" :class="['flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2', activeTab === 'summary' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50']">
                <PieChart size="16" /> Resumen
            </button>
            <button @click="activeTab = 'schedule'" :class="['flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2', activeTab === 'schedule' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50']">
                <List size="16" /> Tabla
            </button>
        </div>

        <div v-if="activeTab === 'summary'" ref="captureArea" class="flex-1 overflow-y-auto p-3 sm:p-5 no-scrollbar flex flex-col items-center">
            <div class="w-full max-w-lg flex flex-col gap-3 sm:gap-4 pb-4">
                
                <div class="bg-white p-3 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3">
                    
                    <div>
                        <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Monto del Préstamo</label>
                        <div class="mt-1 relative flex items-center">
                            <Euro size="18" class="absolute left-3 text-slate-400" />
                            <input 
                              ref="inputAmount" type="text" inputmode="numeric" enterkeyhint="next"
                              :value="amountRaw" @input="handleAmountInput" @keyup.enter="inputYears.focus()"
                              placeholder="0" class="w-full h-11 sm:h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" 
                            />
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Años</label>
                            <div class="mt-1 relative flex items-center">
                                <CalendarDays size="18" class="absolute left-3 text-slate-400" />
                                <input ref="inputYears" type="number" v-model="years" enterkeyhint="next" @keyup.enter="inputInterest.focus()" placeholder="Ej. 0" class="w-full h-11 sm:h-12 pl-10 pr-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Meses</label>
                            <div class="mt-1 relative flex items-center">
                                <CalendarDays size="18" class="absolute left-3 text-slate-400" />
                                <input ref="inputMonths" type="number" v-model="months" enterkeyhint="next" @keyup.enter="inputInterest.focus()" placeholder="Ej. 0" class="w-full h-11 sm:h-12 pl-10 pr-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Interés Anual (%)</label>
                        <div class="mt-1 relative flex items-center">
                            <Percent size="18" class="absolute left-3 text-slate-400" />
                            <input ref="inputInterest" type="text" inputmode="decimal" enterkeyhint="done" :value="interestRateRaw" @input="handleInterestInput" @keyup.enter="$event.target.blur()" placeholder="0,00" class="w-full h-11 sm:h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" />
                        </div>
                    </div>

                    <div class="flex gap-3 pt-1">
                      <button @click="resetSimulator" class="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                        <RotateCcw size="16" /> Clear
                      </button>
                      <button @click="exportJPG" class="flex-[1.5] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                        <Printer size="16" /> Captura JPG
                      </button>
                    </div>
                </div>

                <div class="bg-slate-800 p-4 sm:p-5 rounded-2xl border-[4px] border-slate-900 shadow-xl relative overflow-hidden">
                    <div class="absolute inset-0 carbon-fiber opacity-50 pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col gap-3">
                        <div class="flex justify-between items-end border-b border-slate-700 pb-2">
                            <span class="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Pago Mensual</span>
                            <span class="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{{ formatCurrency(calculations.payment) }}</span>
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Interés Total</span>
                            <span class="text-base sm:text-lg font-black text-blue-400">{{ formatCurrency(calculations.totalInterest) }}</span>
                        </div>
                        <div class="flex justify-between items-end">
                            <span class="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Monto Total</span>
                            <span class="text-base sm:text-lg font-black text-white">{{ formatCurrency(calculations.totalAmount) }}</span>
                        </div>
                        <div class="mt-2 pt-3 border-t border-slate-700 flex items-center justify-between gap-4">
                            <div class="flex flex-col gap-1.5">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div>
                                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Capital ({{ calculations.principalPct.toFixed(1) }}%)</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                                    <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Interés ({{ calculations.interestPct.toFixed(1) }}%)</span>
                                </div>
                            </div>
                            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] border-slate-900 shadow-xl relative overflow-hidden shrink-0" :style="pieChartStyle">
                                <div class="absolute inset-0 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]"></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div v-else class="flex-1 flex flex-col bg-white overflow-hidden pb-16">
            <div class="grid grid-cols-[50px_1fr_1fr_1.4fr] bg-slate-800 text-white p-3 shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest text-right">
                <div class="text-center">Mes</div>
                <div>Capital</div>
                <div>Interés</div>
                <div>Balance</div>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                <div v-if="amortizationSchedule.length === 0" class="p-8 text-center text-slate-400 font-bold text-sm">Ingresa datos para ver la tabla.</div>
                <div v-else v-for="row in amortizationSchedule" :key="row.month" 
                     class="grid grid-cols-[50px_1fr_1fr_1.4fr] p-3 border-b border-slate-200 text-xs sm:text-sm font-medium text-slate-700 text-right hover:bg-blue-50 transition-colors">
                    <div class="text-center font-black text-slate-900">{{ row.month }}</div>
                    <div class="text-blue-600">{{ formatCurrency(row.principal) }}</div>
                    <div class="text-emerald-600">{{ formatCurrency(row.interest) }}</div>
                    <div class="font-bold text-slate-900">{{ formatCurrency(row.balance) }}</div>
                </div>
            </div>

            <div class="absolute bottom-6 left-0 w-full flex justify-center px-6 z-20">
              <button @click="exportPDF" class="w-full max-w-sm h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                <FileDown size="20" /> Descargar Reporte A4 (PDF)
              </button>
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
.app-canvas { display: flex; flex-direction: column; justify-content: space-between; position: relative; background-color: #f8fafc; transition: all 0.4s; width: 100vw; height: 100dvh; overflow: hidden; padding-bottom: env(safe-area-inset-bottom); }
@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15); padding: 0; } }
@media (min-width: 600px) and (max-width: 1024px) { .app-canvas { width: 85vw; max-width: 800px; height: 95dvh; border-radius: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); padding: 0; } }
.carbon-fiber { background: radial-gradient(black 15%, transparent 16%) 0 0, radial-gradient(black 15%, transparent 16%) 4px 4px; background-color: #1e293b; background-size: 8px 8px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>