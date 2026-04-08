<script setup>
/** * ARCHIVO: FinancialSimulator.vue
 * INSTRUMENTO 02: SIMULADOR FINANCIERO (Amortización de Préstamos)
 * ESTÉTICA: Laboratorio Clínico (Blanco, Slate, Azul, Esmeralda)
 * MEJORA: Formateo Europeo Estricto y Sistema de Reinicio de Estado
 */
import { ref, computed, watch } from 'vue';
import { Calculator, CalendarDays, Percent, PieChart, List, Euro, RotateCcw } from 'lucide-vue-next';

const emit = defineEmits(['close']);

// --- ⚙️ VARIABLES DE ENTRADA (Estado visual) ---
const amountRaw = ref(''); 
const years = ref('');
const months = ref('');
const interestRateRaw = ref(''); 

// --- 🎯 REFERENCIAS PARA NAVEGACIÓN SEMIAUTOMÁTICA ---
const inputAmount = ref(null);
const inputYears = ref(null);
const inputMonths = ref(null);
const inputInterest = ref(null);

// --- 🧭 NAVEGACIÓN INTERNA ---
const activeTab = ref('summary'); // 'summary' | 'schedule'

// --- 🧹 SISTEMA DE REINICIO ---
const resetSimulator = () => {
  amountRaw.value = '';
  years.value = '';
  months.value = '';
  interestRateRaw.value = '';
  activeTab.value = 'summary';
  
  // Devuelve el foco al primer input para que el usuario pueda teclear inmediatamente
  setTimeout(() => {
    if (inputAmount.value) inputAmount.value.focus();
  }, 50);
};

const handleClose = () => {
  resetSimulator(); // Limpieza automática garantizada antes de salir
  emit('close');
};

// --- 🧩 LÓGICA DE EXCLUSIÓN MUTUA (AÑOS vs MESES) ---
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

// --- 🧩 FILTROS DE ENTRADA EUROPEOS (TIEMPO REAL) ---
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
  if (parts.length > 2) {
    val = parts[0] + ',' + parts.slice(1).join('');
  }
  
  if (parts[1] !== undefined && parts[1].length > 2) {
    val = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
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

  let pmt = 0;
  if (r === 0) {
    pmt = p / n;
  } else {
    pmt = (p * r) / (1 - Math.pow(1 + r, -n));
  }

  const totalAmt = pmt * n;
  const totalInt = totalAmt - p;
  
  const intPct = totalAmt > 0 ? (totalInt / totalAmt) * 100 : 0;
  const prinPct = totalAmt > 0 ? (p / totalAmt) * 100 : 0;

  return {
    payment: pmt,
    totalInterest: totalInt,
    totalAmount: totalAmt,
    interestPct: intPct,
    principalPct: prinPct
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
    
    if (i === n) {
      principalForMonth = balance;
    }

    balance -= principalForMonth;
    if (balance < 0) balance = 0;

    schedule.push({
      month: i,
      payment: principalForMonth + interestForMonth,
      principal: principalForMonth,
      interest: interestForMonth,
      balance: balance
    });
  }
  return schedule;
});

// --- 🎨 FORMATEADORES ---
const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
};

const pieChartStyle = computed(() => {
  const intPct = calculations.value.interestPct.toFixed(1);
  return {
    background: `conic-gradient(#10b981 0% ${intPct}%, #3b82f6 ${intPct}% 100%)`
  };
});
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

        <div v-if="activeTab === 'summary'" class="flex-1 overflow-y-auto p-3 sm:p-5 no-scrollbar flex flex-col items-center">
            <div class="w-full max-w-lg flex flex-col gap-3 sm:gap-4 pb-4">
                
                <div class="bg-white p-3 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm space-y-3">
                    
                    <div>
                        <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Monto del Préstamo</label>
                        <div class="mt-1 relative flex items-center">
                            <Euro size="18" class="absolute left-3 text-slate-400" />
                            <input 
                              ref="inputAmount"
                              type="text" 
                              inputmode="numeric"
                              enterkeyhint="next"
                              :value="amountRaw" 
                              @input="handleAmountInput"
                              @keyup.enter="inputYears.focus()"
                              placeholder="0"
                              class="w-full h-11 sm:h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" 
                            />
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Años</label>
                            <div class="mt-1 relative flex items-center">
                                <CalendarDays size="18" class="absolute left-3 text-slate-400" />
                                <input 
                                  ref="inputYears"
                                  type="number" 
                                  v-model="years" 
                                  enterkeyhint="next"
                                  @keyup.enter="inputInterest.focus()"
                                  placeholder="Ej. 0" 
                                  class="w-full h-11 sm:h-12 pl-10 pr-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" 
                                />
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Meses</label>
                            <div class="mt-1 relative flex items-center">
                                <CalendarDays size="18" class="absolute left-3 text-slate-400" />
                                <input 
                                  ref="inputMonths"
                                  type="number" 
                                  v-model="months" 
                                  enterkeyhint="next"
                                  @keyup.enter="inputInterest.focus()"
                                  placeholder="Ej. 0" 
                                  class="w-full h-11 sm:h-12 pl-10 pr-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Interés Anual (%)</label>
                        <div class="mt-1 relative flex items-center">
                            <Percent size="18" class="absolute left-3 text-slate-400" />
                            <input 
                              ref="inputInterest"
                              type="text" 
                              inputmode="decimal"
                              enterkeyhint="done"
                              :value="interestRateRaw"
                              @input="handleInterestInput"
                              @keyup.enter="$event.target.blur()"
                              placeholder="0,00"
                              class="w-full h-11 sm:h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all" 
                            />
                        </div>
                    </div>

                    <button 
                      @click="resetSimulator" 
                      class="w-full mt-2 py-2.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-sm uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                    >
                      <RotateCcw size="18" /> Nueva Simulación
                    </button>
                </div>

                <div class="bg-slate-800 p-4 sm:p-5 rounded-2xl border-[4px] border-slate-900 shadow-xl relative overflow-hidden">
                    <div class="absolute inset-0 carbon-fiber opacity-50 pointer-events-none"></div>
                    
                    <div class="relative z-10 flex flex-col gap-3">
                        <div class="flex justify-between items-end border-b border-slate-700 pb-2">
                            <span class="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Pago Mensual</span>
                            <span class="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                                {{ formatCurrency(calculations.payment) }}
                            </span>
                        </div>
                        
                        <div class="flex justify-between items-end">
                            <span class="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Interés Total</span>
                            <span class="text-base sm:text-lg font-black text-blue-400">
                                {{ formatCurrency(calculations.totalInterest) }}
                            </span>
                        </div>
                        
                        <div class="flex justify-between items-end">
                            <span class="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Monto Total</span>
                            <span class="text-base sm:text-lg font-black text-white">
                                {{ formatCurrency(calculations.totalAmount) }}
                            </span>
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

        <div v-else class="flex-1 flex flex-col bg-white overflow-hidden">
            <div class="grid grid-cols-4 bg-slate-800 text-white p-3 shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-widest text-right">
                <div class="text-center">Mes</div>
                <div>Capital</div>
                <div>Interés</div>
                <div>Balance</div>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                <div v-if="amortizationSchedule.length === 0" class="p-8 text-center text-slate-400 font-bold text-sm">
                    Ingresa un monto y plazo válidos para ver la tabla.
                </div>
                <div v-else 
                     v-for="row in amortizationSchedule" :key="row.month"
                     class="grid grid-cols-4 p-3 border-b border-slate-200 text-xs sm:text-sm font-medium text-slate-700 text-right hover:bg-blue-50 transition-colors">
                    <div class="text-center font-black text-slate-900">{{ row.month }}</div>
                    <div class="text-blue-600">{{ formatCurrency(row.principal) }}</div>
                    <div class="text-emerald-600">{{ formatCurrency(row.interest) }}</div>
                    <div class="font-bold text-slate-800">{{ formatCurrency(row.balance) }}</div>
                </div>
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

/* 🛡️ CONTENEDOR MAESTRO */
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

/* 📱 LIENZO DE LA APP */
.app-canvas {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  background-color: #f8fafc;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);

  width: 100vw;
  height: 100dvh;
  overflow: hidden; 
}

/* 💻 ADAPTACIÓN PROGRESIVA */
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
  .app-canvas { 
    width: 85vw; 
    max-width: 800px; 
    height: 95dvh; 
    border-radius: 35px; 
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    padding: 0;
  }
}

.header-standard {
  width: 100%;
  background: white;
  border-bottom: 2px solid #e2e8f0;
}

/* Textura para la pantalla LCD */
.carbon-fiber {
  background: 
    radial-gradient(black 15%, transparent 16%) 0 0,
    radial-gradient(black 15%, transparent 16%) 4px 4px,
    radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px,
    radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 4px 5px;
  background-color: #1e293b; background-size: 8px 8px;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>