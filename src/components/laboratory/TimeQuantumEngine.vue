<script setup>
/**
 * ARCHIVO: TimeQuantumEngine.vue
 * VERSIÓN: 9.5 - Kinetic Acceleration & Sensory Audio
 * OBJETIVO: Motor de inercia para saltos temporales largos con retroalimentación auditiva de pitch.
 */
import { ref, computed } from 'vue';
import { 
  CalendarDays, Clock3, RefreshCw, BrainCircuit, X, Zap, 
  ChevronUp, ChevronDown, Printer, Calendar as CalendarIcon 
} from 'lucide-vue-next';

const emit = defineEmits(['close']);

// --- 🔊 SISTEMA DE AUDIO (CON ACELERACIÓN SENSORIAL) ---
const pressSound = new Audio('/audios/press.mp3');
const dialTickSound = new Audio('/src/assets/sounds/boveda/dial-tick.mp3');

const playPress = () => { pressSound.currentTime = 0; pressSound.play().catch(() => {}); };

const playDialTick = (step = 1) => { 
  dialTickSound.currentTime = 0; 
  
  // Modulación de tono (pitch) según la agresividad del giro
  if (step >= 100) dialTickSound.playbackRate = 2.5;      // Tono robótico agudo (Turbo)
  else if (step >= 10) dialTickSound.playbackRate = 1.5;  // Tono mecánico rápido
  else dialTickSound.playbackRate = 1.0;                  // Tono normal (1 en 1)
  
  dialTickSound.play().catch(() => {}); 
};

// --- 🧭 NAVEGACIÓN ---
const modes = [
  { id: 'dateDiff', name: 'Fechas', icon: CalendarDays },
  { id: 'timeDiff', name: 'Horas', icon: Clock3 },
  { id: 'convert', name: 'Conversión', icon: RefreshCw },
  { id: 'perpetual', name: 'Calendario', icon: CalendarIcon }
];
const activeMode = ref('timeDiff');

// --- ⚙️ CONFIGURACIÓN DUAL TIME ---
const is24HourFormat = ref(false);
const toggleFormat = () => { is24HourFormat.value = !is24HourFormat.value; playPress(); };

// --- 📊 ESTADOS MOTORIZADOS ---
const d1 = ref(new Date());
const d2 = ref(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
const t1 = ref({ h: 8, m: 0 });
const t2 = ref({ h: 17, m: 30 });
const calDate = ref(new Date());
const totalSeconds = ref(3661);

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// --- 🧭 DICCIONARIOS DE REFERENCIAS ---
const dateRefs = { INICIO: d1, FINAL: d2, CALENDARIO: calDate };
const timeRefs = { ORIGEN: t1, DESTINO: t2 };

// --- 🎰 MOTOR FÍSICO 2.5D ---
const moveDate = (label, unit, step) => {
  const target = dateRefs[label];
  const d = new Date(target.value);
  if (unit === 'day') d.setDate(d.getDate() + step);
  if (unit === 'month') d.setMonth(d.getMonth() + step);
  if (unit === 'year') d.setFullYear(d.getFullYear() + step);
  target.value = d;
  
  // Enviamos la fuerza del salto al motor de audio
  playDialTick(Math.abs(step)); 
};

const moveTime = (label, unit, step) => {
  const target = timeRefs[label].value;
  if (unit === 'h') target.h = (((target.h + step) % 24) + 24) % 24;
  if (unit === 'm') target.m = (((target.m + step) % 60) + 60) % 60;
  playDialTick(Math.abs(step));
};

const toggleAMPM = (label) => {
  const target = timeRefs[label].value;
  target.h = (target.h + 12) % 24;
  playPress();
};

const moveTotalSeconds = (unit, step) => {
  const multipliers = { d: 86400, h: 3600, m: 60, s: 1, total: 100 };
  const delta = step * (multipliers[unit] || 1);
  if (totalSeconds.value + delta >= 0) {
    totalSeconds.value += delta;
    playDialTick(Math.abs(step));
  }
};

// --- 🖱️ CONTROLADORES DE INTERACCIÓN (MOUSE & TOUCH CON ACELERACIÓN) ---
let lastWheelTime = 0;
let wheelCombo = 0;

const handleWheel = (e, callback, ...args) => {
  let step = 1;
  const isAccelerable = args.includes('year') || args.includes('total');

  // Aceleración Inercial para Ratón (basada en frecuencia de giros)
  if (isAccelerable) {
    const now = Date.now();
    if (now - lastWheelTime < 50) { // Si gira la rueda muy rápido (menos de 50ms entre ticks)
      wheelCombo++;
      if (wheelCombo > 15) step = 100;      // Modo Turbo
      else if (wheelCombo > 5) step = 10;   // Modo Rápido
    } else {
      wheelCombo = 0; // Resetea si hace una pausa
    }
    lastWheelTime = now;
  }

  callback(...args, e.deltaY > 0 ? step : -step);
};

let touchStartY = 0;
let touchStartTime = 0;
const touchThreshold = 30; // Píxeles físicos para el salto base

const handleTouchStart = (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
};

const handleTouchMove = (e, callback, ...args) => {
  const touchCurrentY = e.touches[0].clientY;
  const deltaY = touchStartY - touchCurrentY;

  if (Math.abs(deltaY) > touchThreshold) {
    let step = 1;
    const isAccelerable = args.includes('year') || args.includes('total');
    
    // Aceleración Inercial Táctil (basada en la velocidad del arrastre)
    if (isAccelerable) {
      const timeDiff = Date.now() - touchStartTime;
      const velocity = Math.abs(deltaY) / (timeDiff || 1); // Píxeles desplazados por milisegundo
      
      if (velocity > 1.5) step = 100;      // Swipe muy brusco
      else if (velocity > 0.5) step = 10;  // Swipe medio rápido
    }

    callback(...args, deltaY > 0 ? step : -step);
    
    // Reiniciamos los anclajes para el siguiente cálculo continuo
    touchStartY = touchCurrentY;
    touchStartTime = Date.now();
  }
};

const getRollerStyle = (diff) => ({
  transform: `translateY(${diff * 35}px) rotateX(${diff * -25}deg) scale(${1 - Math.abs(diff) * 0.1})`,
  opacity: 1 - Math.abs(diff) * 0.4,
  zIndex: 10 - Math.abs(diff)
});

// --- 🪄 HELPERS DE RENDERIZADO VISUAL ---
const format12h = (h) => ((((h % 12) + 12) % 12) || 12).toString().padStart(2, '0');

const getVisualDateUnit = (dateVal, unit, offset) => {
  const d = new Date(dateVal);
  if (unit === 'month') return monthNames[(((d.getMonth() + offset) % 12) + 12) % 12];
  if (unit === 'year') return d.getFullYear() + offset;
  d.setDate(d.getDate() + offset);
  return d.getDate();
};

const getVisualTimeUnit = (timeVal, unit, offset) => {
  if (unit === 'h') {
    const h = timeVal.h + offset;
    return is24HourFormat.value ? (((h % 24) + 24) % 24).toString().padStart(2, '0') : format12h(h);
  }
  return (((timeVal.m + offset) % 60) + 60 % 60).toString().padStart(2, '0');
};

// --- 🧠 MOTOR DE CÁLCULOS ---
const dateDiffResult = computed(() => {
  let start = new Date(d1.value);
  let end = new Date(d2.value);
  if (end < start) [start, end] = [end, start];
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0) { m--; d += new Date(end.getFullYear(), end.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return { y, m, d };
});

const timeDiffResult = computed(() => {
  const sec1 = t1.value.h * 3600 + t1.value.m * 60;
  const sec2 = t2.value.h * 3600 + t2.value.m * 60;
  let diff = sec2 - sec1;
  if (diff < 0) diff += 86400;
  return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60) };
});

const mathAnalysis = computed(() => {
  const n = calDate.value.getDate();
  const isPrime = (num) => {
    for(let i = 2, s = Math.sqrt(num); i <= s; i++) if(num % i === 0) return false; 
    return num > 1;
  };
  const facts = [];
  if (isPrime(n)) facts.push(`Día ${n}: ¡NÚMERO PRIMO! 🔢`);
  if (Number.isInteger(Math.sqrt(n))) facts.push(`Día ${n}: CUADRADO PERFECTO DE ${Math.sqrt(n)}`);
  facts.push(n % 2 === 0 ? "CICLO PAR" : "CICLO IMPAR");
  return facts;
});

const dayOfWeek = computed(() => new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(calDate.value).toUpperCase());
const daysRemaining = computed(() => {
  const end = new Date(calDate.value.getFullYear(), 11, 31);
  return Math.ceil((end - calDate.value) / (1000 * 60 * 60 * 24));
});

const timeUnits = computed(() => {
  let s = totalSeconds.value;
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
});
</script>

<template>
  <div class="master-container font-numbers">
    <main class="app-canvas shadow-2xl">
      
      <header class="header-standard shrink-0 relative flex justify-between align-items-center py-2 sm:py-3 px-4 sm:px-6 shadow-md z-50 bg-white">
        <div class="w-8 h-8 sm:w-10 sm:h-10 invisible hidden md:block"></div>
        <div class="flex align-items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <div class="w-8 h-8 rounded-full bg-blue-100 flex align-items-center justify-center text-blue-600 shrink-0 shadow-sm">
                <Zap size="18" stroke-width="2.5" />
            </div>
            <span class="text-[#312e81] font-black text-[15px] sm:text-xl uppercase tracking-widest leading-none font-numbers italic text-shadow-sm mt-0.5 truncate">
              Quantum Engine
            </span>
        </div>
        <button @click="emit('close'); playPress()" class="cyber-close-btn relative z-50">
          <X size="20" stroke-width="3" />
        </button>
      </header>

      <div class="console-work-panel flex-1 overflow-y-auto custom-scrollbar relative z-10">
        
        <div class="hologram-display relative mb-4 z-20">
          <div class="hologram-content border-white/40 bg-white/10 shadow-xl py-3">
            <div class="flex align-items-center justify-center gap-3">
              <BrainCircuit class="text-cyan-300" size="20" />
              <p class="text-white font-black italic text-[13px] uppercase tracking-tighter">Bóveda de Tiempo Activa</p>
            </div>
          </div>
          <div v-if="activeMode === 'timeDiff'" class="format-switch-container mt-3" @click="toggleFormat">
             <span :class="!is24HourFormat ? 'text-white' : 'text-white/40'">12H</span>
             <div class="switch-track border-white/50"><div class="switch-ball bg-white shadow-lg" :class="{'ball-right': is24HourFormat}"></div></div>
             <span :class="is24HourFormat ? 'text-white' : 'text-white/40'">24H</span>
          </div>
        </div>

        <div class="modes-rack grid grid-cols-4 gap-2 mb-6 relative z-40">
          <button v-for="m in modes" :key="m.id" @click="activeMode = m.id; playPress()"
            :class="[activeMode === m.id ? 'mode-active' : 'mode-inactive']" class="mode-btn">
            <component :is="m.icon" size="18" />
            <span class="text-[9px] font-black mt-1 uppercase">{{ m.name }}</span>
          </button>
        </div>

        <div class="quantum-area animate-in relative z-30">
          
          <div v-if="activeMode === 'dateDiff'" class="space-y-4">
             <div v-for="(dateVal, label) in {INICIO: d1, FINAL: d2}" :key="label" class="relative">
                <label class="micro-label bg-indigo-600">{{ label }}</label>
                <div class="vault-white flex h-[100px] overflow-hidden">
                   <div v-for="unit in ['day','month','year']" :key="unit" class="flex-1 relative z-20 kinetic-drum" 
                        @wheel.prevent="handleWheel($event, moveDate, label, unit)"
                        @touchstart="handleTouchStart"
                        @touchmove.prevent="handleTouchMove($event, moveDate, label, unit)">
                      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <div v-for="i in [-1,0,1]" :key="i" class="absolute transition-all duration-200" :style="getRollerStyle(i)">
                            <span class="text-lg font-black" :class="i === 0 ? 'text-indigo-600' : 'text-slate-200'">
                               {{ getVisualDateUnit(dateVal, unit, i) }}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div v-if="activeMode === 'timeDiff'" class="space-y-4">
             <div v-for="(timeVal, label) in {ORIGEN: t1, DESTINO: t2}" :key="label" class="relative">
                <label class="micro-label bg-blue-600">{{ label }}</label>
                <div class="vault-white flex h-[100px] overflow-hidden">
                   <div v-for="unit in ['h','m']" :key="unit" class="flex-1 relative z-20 kinetic-drum" 
                        @wheel.prevent="handleWheel($event, moveTime, label, unit)"
                        @touchstart="handleTouchStart"
                        @touchmove.prevent="handleTouchMove($event, moveTime, label, unit)">
                      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <div v-for="i in [-1,0,1]" :key="i" class="absolute transition-all duration-200" :style="getRollerStyle(i)">
                            <span class="text-2xl font-black" :class="i === 0 ? 'text-blue-600' : 'text-slate-200'">
                               {{ getVisualTimeUnit(timeVal, unit, i) }}
                            </span>
                         </div>
                      </div>
                   </div>
                   <button v-if="!is24HourFormat" @click="toggleAMPM(label)" class="period-btn-fixed relative z-30 touch-manipulation">
                      {{ timeVal.h >= 12 ? 'PM' : 'AM' }}
                   </button>
                </div>
             </div>
          </div>

          <div v-if="activeMode === 'perpetual'" class="space-y-4">
            <div class="vault-white flex h-[120px] overflow-hidden">
               <div v-for="u in ['day','month','year']" :key="u" class="flex-1 relative z-20 kinetic-drum" 
                    @wheel.prevent="handleWheel($event, moveDate, 'CALENDARIO', u)"
                    @touchstart="handleTouchStart"
                    @touchmove.prevent="handleTouchMove($event, moveDate, 'CALENDARIO', u)">
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <div v-for="i in [-1,0,1]" :key="i" class="absolute transition-all duration-200" :style="getRollerStyle(i)">
                        <span class="text-xl font-black" :class="i === 0 ? 'text-indigo-600' : 'text-slate-200'">
                           {{ getVisualDateUnit(calDate, u, i) }}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
            <div class="grid grid-cols-1 gap-1">
               <div v-for="(f, i) in mathAnalysis" :key="i" class="bg-indigo-400/10 border-l-4 border-indigo-400 p-2 rounded-r-lg">
                  <p class="text-[10px] text-white font-black uppercase tracking-widest">{{ f }}</p>
               </div>
            </div>
          </div>

          <div v-if="activeMode === 'convert'" class="space-y-4">
             <div class="cyber-drum-large border-emerald-400 relative z-20 kinetic-drum" 
                  @wheel.prevent="handleWheel($event, moveTotalSeconds, 'total')"
                  @touchstart="handleTouchStart"
                  @touchmove.prevent="handleTouchMove($event, moveTotalSeconds, 'total')">
                <div class="text-center w-full pointer-events-none">
                  <div class="text-4xl font-black text-emerald-400 tracking-tighter">{{ totalSeconds }}</div>
                  <div class="text-[10px] text-white font-black uppercase tracking-widest mt-1">Masa de Tiempo</div>
                </div>
             </div>
             <div class="grid grid-cols-4 gap-2 relative z-20">
                <div v-for="(val, u) in timeUnits" :key="u" class="unit-card bg-white kinetic-drum" 
                     @wheel.prevent="handleWheel($event, moveTotalSeconds, u)"
                     @touchstart="handleTouchStart"
                     @touchmove.prevent="handleTouchMove($event, moveTotalSeconds, u)">
                   <span class="text-indigo-900 font-black text-xl pointer-events-none">{{ val }}</span>
                   <span class="text-[10px] text-cyan-600 font-black uppercase pointer-events-none">{{ u }}</span>
                </div>
             </div>
          </div>

        </div>

        <footer class="display-results mt-10 relative z-10">
          <div class="display-inner bg-black border-white/20 shadow-2xl">
            <template v-if="activeMode === 'perpetual'">
               <div class="text-cyan-300 font-black text-3xl tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                 {{ dayOfWeek }}
               </div>
               <div class="text-[11px] text-white font-black mt-2 uppercase tracking-[3px] opacity-70">
                 {{ daysRemaining }} DÍAS PARA FIN DE AÑO
               </div>
            </template>
            <div v-else-if="activeMode === 'dateDiff'" class="text-white font-black text-2xl uppercase">
              {{ dateDiffResult.y }}A : {{ dateDiffResult.m }}M : {{ dateDiffResult.d }}D
            </div>
            <div v-else-if="activeMode === 'timeDiff'" class="text-white font-black text-3xl italic">
              {{ timeDiffResult.h }}H : {{ timeDiffResult.m }}M
            </div>
            <div v-else class="text-emerald-400 font-black text-xl italic uppercase">Conversión Sincronizada</div>
          </div>
        </footer>
      </div>

      <div class="console-footer shrink-0 py-2">
         <div class="v-pill border-white/20 text-white/30 uppercase">V9.5 | KINETIC ACCELERATION ENABLED</div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.font-numbers { font-family: 'Nunito', sans-serif; }
.master-container { position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: #ffffff; overscroll-behavior: none; }

.app-canvas {
  display: flex; flex-direction: column; position: relative; background-color: #1e1b4b;
  width: 100vw; height: 100dvh; overflow: hidden; overscroll-behavior: none;
}

@media (min-width: 1025px) { .app-canvas { width: 1024px; height: 90dvh; border-radius: 45px; border: 8px solid white; box-shadow: 0 40px 100px rgba(0,0,0,0.15); } }

.header-standard { background: white; border-bottom: 2px solid #f1f5f9; }
.text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
.cyber-close-btn { width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; border: 2px solid #cbd5e1; display: flex; justify-content: center; align-items: center; cursor: pointer; touch-action: manipulation; }

.console-work-panel { padding: 1.2rem; background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%); overscroll-behavior: contain; }

.format-switch-container { display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; touch-action: manipulation; }
.switch-track { width: 40px; height: 20px; border-radius: 20px; border: 1.5px solid white; position: relative; }
.switch-ball { width: 14px; height: 14px; border-radius: 50%; position: absolute; top: 1.5px; left: 2px; transition: 0.3s; }
.ball-right { left: 21px; }

.mode-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 15px; padding: 10px 5px; transition: 0.2s; cursor: pointer; touch-action: manipulation; }
.mode-inactive { background: #334155; color: #cbd5e1; border-bottom: 4px solid #1e293b; }
.mode-active { background: #4f46e5; color: white; border-bottom: 4px solid #312e81; transform: translateY(-2px); }

.micro-label { position: absolute; top: -12px; left: 12px; font-size: 8px; font-weight: 900; color: white; background: #4f46e5; padding: 2px 8px; border-radius: 4px; z-index: 10; letter-spacing: 1px; }
.vault-white { background: white; border-radius: 20px; border: 3px solid #312e81; position: relative; perspective: 1000px; z-index: 10; }

.kinetic-drum { cursor: ns-resize; touch-action: none; }

.period-btn-fixed { 
  background: #fbbf24; color: #000; font-weight: 900; 
  width: 65px; border-radius: 15px; border-left: 3px solid #312e81; 
  font-size: 1.1rem; border-bottom: 5px solid #b45309;
  transition: all 0.1s;
}
.period-btn-fixed:active { transform: scale(0.95); border-bottom-width: 2px; }
.touch-manipulation { touch-action: manipulation; }

.cyber-drum-large { height: 90px; background: black; border-radius: 25px; border: 4px solid #4ade80; display: flex; align-items: center; padding: 0 1.5rem; }
.unit-card { border-radius: 15px; display: flex; flex-direction: column; align-items: center; padding: 8px; border: 2px solid #1e293b; }

.display-inner { padding: 2rem 1.5rem; border-radius: 35px; border-width: 3px; text-align: center; }
.v-pill { padding: 3px 12px; border-radius: 20px; border-width: 1px; font-size: 10px; font-weight: 900; }

.animate-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.align-items-center { align-items: center; }
</style>