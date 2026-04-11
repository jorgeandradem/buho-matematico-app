<script setup>
/** * ARCHIVO: QuantumConverter.vue
 * VERSION: 3.7 - Ergonómica Pro (Teclado Ampliado y Ajuste al Tope).
 * NOTA: Redistribución de espacio vertical para facilitar el uso táctil.
 */
import { ref, computed, watch } from 'vue';

const emit = defineEmits(['close']);

// --- 🔊 SISTEMA DE AUDIO (clip.mp3) ---
const audioTick = new Audio('/audios/clip.mp3');
const playTick = () => {
  audioTick.currentTime = 0;
  audioTick.play().catch(() => {}); 
};

// --- ⚙️ BASE DE DATOS DE UNIDADES (6 CATEGORÍAS COMPLETAS) ---
const categories = [
  {
    id: 'length', name: 'Longitud', icon: '📏',
    units: [
      { id: 'm', name: 'Metros', sym: 'm', factor: 1 },
      { id: 'cm', name: 'Centímetros', sym: 'cm', factor: 0.01 },
      { id: 'km', name: 'Kilómetros', sym: 'km', factor: 1000 },
      { id: 'in', name: 'Pulgadas', sym: 'in', factor: 0.0254 },
      { id: 'ft', name: 'Pies', sym: 'ft', factor: 0.3048 },
      { id: 'yd', name: 'Yardas', sym: 'yd', factor: 0.9144 },
      { id: 'mi', name: 'Millas', sym: 'mi', factor: 1609.34 }
    ]
  },
  {
    id: 'weight', name: 'Masa', icon: '⚖️',
    units: [
      { id: 'kg', name: 'Kilogramos', sym: 'kg', factor: 1 },
      { id: 'g', name: 'Gramos', sym: 'g', factor: 0.001 },
      { id: 'mg', name: 'Miligramos', sym: 'mg', factor: 0.000001 },
      { id: 'lb', name: 'Libras', sym: 'lb', factor: 0.453592 },
      { id: 'oz', name: 'Onzas', sym: 'oz', factor: 0.0283495 },
      { id: 't', name: 'Toneladas', sym: 't', factor: 1000 }
    ]
  },
  {
    id: 'temp', name: 'Temp', icon: '🌡️',
    units: [
      { id: 'c', name: 'Celsius', sym: '°C' },
      { id: 'f', name: 'Fahrenheit', sym: '°F' },
      { id: 'k', name: 'Kelvin', sym: 'K' }
    ]
  },
  {
    id: 'area', name: 'Área', icon: '📐',
    units: [
      { id: 'm2', name: 'Metros²', sym: 'm²', factor: 1 },
      { id: 'cm2', name: 'Centímetros²', sym: 'cm²', factor: 0.0001 },
      { id: 'km2', name: 'Kilómetros²', sym: 'km²', factor: 1000000 },
      { id: 'ha', name: 'Hectáreas', sym: 'ha', factor: 10000 },
      { id: 'ac', name: 'Acres', sym: 'ac', factor: 4046.856 },
      { id: 'ft2', name: 'Pies²', sym: 'ft²', factor: 0.092903 },
      { id: 'in2', name: 'Pulgadas²', sym: 'in²', factor: 0.00064516 }
    ]
  },
  {
    id: 'volume', name: 'Volumen', icon: '🧪',
    units: [
      { id: 'l', name: 'Litros', sym: 'L', factor: 1 },
      { id: 'ml', name: 'Mililitros', sym: 'mL', factor: 0.001 },
      { id: 'm3', name: 'Metros³', sym: 'm³', factor: 1000 },
      { id: 'cm3', name: 'Centímetros³', sym: 'cm³', factor: 0.001 },
      { id: 'gal', name: 'Galones', sym: 'gal', factor: 3.78541 },
      { id: 'floz', name: 'Onzas Liq.', sym: 'fl oz', factor: 0.0295735 }
    ]
  },
  {
    id: 'pressure', name: 'Presión', icon: '🗜️',
    units: [
      { id: 'pa', name: 'Pascales', sym: 'Pa', factor: 1 },
      { id: 'bar', name: 'Bares', sym: 'bar', factor: 100000 },
      { id: 'atm', name: 'Atmósferas', sym: 'atm', factor: 101325 },
      { id: 'psi', name: 'PSI', sym: 'psi', factor: 6894.76 },
      { id: 'mmhg', name: 'mmHg', sym: 'mmHg', factor: 133.322 }
    ]
  }
];

// --- ESTADO REACTIVO PRINCIPAL ---
const navIndex = ref(0); 
const topIndex = ref(0);
const bottomIndex = ref(1); 
const inputValue = ref('0');
const activeBox = ref('top'); 
const shouldResetInput = ref(false); 

const keypad = [
  '7', '8', '9', '±', '⌫',
  '4', '5', '6', '.', 'C',
  '1', '2', '3', '0', ''
];

// --- COMPUTADOS Y NAVEGACIÓN ---
const activeCategoryIndex = computed(() => ((navIndex.value % categories.length) + categories.length) % categories.length);
const activeCategory = computed(() => categories[activeCategoryIndex.value]);
const currentUnits = computed(() => activeCategory.value.units);

const topUnit = computed(() => currentUnits.value[topIndex.value]);
const bottomUnit = computed(() => currentUnits.value[bottomIndex.value]);

watch(navIndex, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    topIndex.value = 0;
    bottomIndex.value = 1;
    inputValue.value = '0';
    activeBox.value = 'top';
    shouldResetInput.value = false;
  }
});

// --- MOTOR MATEMÁTICO ---
const convertValue = (val, fromU, toU) => {
  if (fromU.id === toU.id) return val;
  if (activeCategory.value.id === 'temp') {
    let c = 0;
    if (fromU.id === 'c') c = val;
    else if (fromU.id === 'f') c = (val - 32) * (5/9);
    else if (fromU.id === 'k') c = val - 273.15;
    
    if (toU.id === 'c') return c;
    if (toU.id === 'f') return (c * 9/5) + 32;
    if (toU.id === 'k') return c + 273.15;
  }
  return (val * fromU.factor) / toU.factor;
};

const formatNumber = (num) => {
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return '0';
  return Number.isInteger(parsed) ? parsed.toLocaleString('es-ES') : parseFloat(parsed.toFixed(6)).toLocaleString('es-ES', { maximumFractionDigits: 6 });
};

const formatInputDisplay = (val) => {
  if (val === '') return '0';
  if (val.endsWith('.')) return parseFloat(val).toLocaleString('es-ES') + ','; 
  if (val.includes('.')) {
    const parts = val.split('.');
    return parseFloat(parts[0]).toLocaleString('es-ES') + ',' + parts[1];
  }
  return parseFloat(val).toLocaleString('es-ES');
};

const topDisplayValue = computed(() => {
  if (activeBox.value === 'top') return formatInputDisplay(inputValue.value);
  const val = parseFloat(inputValue.value || 0);
  return formatNumber(convertValue(val, bottomUnit.value, topUnit.value));
});

const bottomDisplayValue = computed(() => {
  if (activeBox.value === 'bottom') return formatInputDisplay(inputValue.value);
  const val = parseFloat(inputValue.value || 0);
  return formatNumber(convertValue(val, topUnit.value, bottomUnit.value));
});

const formulaDisplay = computed(() => {
  const factorRaw = activeCategory.value.id === 'temp' ? 1 : topUnit.value.factor / bottomUnit.value.factor;
  return `1 ${topUnit.value.sym} = ${parseFloat(factorRaw.toFixed(6))} ${bottomUnit.value.sym}`;
});

// --- MÉTODOS DEL TECLADO ---
const selectBox = (box) => {
  if (activeBox.value === box) return;
  inputValue.value = box === 'top' 
    ? topDisplayValue.value.replace(/\./g, '').replace(',', '.') 
    : bottomDisplayValue.value.replace(/\./g, '').replace(',', '.');
  activeBox.value = box;
  shouldResetInput.value = true;
};

const handleKey = (key) => {
  if (key === '') return;
  if (key === 'C') { inputValue.value = '0'; shouldResetInput.value = false; return; }
  if (key === '±') {
    if (inputValue.value !== '0') inputValue.value = inputValue.value.startsWith('-') ? inputValue.value.slice(1) : '-' + inputValue.value;
    shouldResetInput.value = false; return;
  }
  if (key === '⌫') {
    if (shouldResetInput.value) { inputValue.value = '0'; shouldResetInput.value = false; } 
    else {
      inputValue.value = inputValue.value.slice(0, -1) || '0';
      if (inputValue.value === '-') inputValue.value = '0';
    }
    return;
  }
  if (shouldResetInput.value) {
    inputValue.value = key === '.' ? '0.' : key;
    shouldResetInput.value = false; return;
  }
  if (key === '.') {
    if (!inputValue.value.includes('.')) inputValue.value += '.';
    return;
  }
  if (inputValue.value.length >= 12 && key !== '00') return;
  inputValue.value = (inputValue.value === '0' || inputValue.value === '-0') ? inputValue.value.replace('0', key) : inputValue.value + key;
};

// --- MOTOR FÍSICO 2.5D (VERTICAL) ---
const dragState = { top: { isDragging: false, startY: 0 }, bottom: { isDragging: false, startY: 0 } };
const DRAG_THRESHOLD = 30; 

const playHapticTick = () => { 
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10); 
  playTick(); 
};

const moveVerticalIndex = (type, step) => {
  const max = currentUnits.value.length - 1;
  if (type === 'top') {
    const newVal = Math.max(0, Math.min(max, topIndex.value + step));
    if (newVal !== topIndex.value) { topIndex.value = newVal; playHapticTick(); }
  } else {
    const newVal = Math.max(0, Math.min(max, bottomIndex.value + step));
    if (newVal !== bottomIndex.value) { bottomIndex.value = newVal; playHapticTick(); }
  }
};

const handleVerticalWheel = (e, type) => { moveVerticalIndex(type, e.deltaY > 0 ? 1 : -1); };

const startVerticalDrag = (e, type) => {
  dragState[type].isDragging = true;
  dragState[type].startY = e.touches ? e.touches[0].clientY : e.clientY;
};

const onVerticalDrag = (e, type) => {
  if (!dragState[type].isDragging) return;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  const diff = dragState[type].startY - currentY;
  if (Math.abs(diff) > DRAG_THRESHOLD) {
    moveVerticalIndex(type, Math.round(diff / DRAG_THRESHOLD));
    dragState[type].startY = currentY; 
  }
};
const stopVerticalDrag = (type) => { dragState[type].isDragging = false; };

const getVerticalRollerStyle = (index, selectedIdx) => {
  const diff = index - selectedIdx;
  if (Math.abs(diff) > 3) return { opacity: 0, pointerEvents: 'none' };
  return {
    transform: `translateY(calc(-50% + ${diff * 32}px)) rotateX(${diff * -22}deg) scale(${1 - Math.abs(diff) * 0.02})`,
    opacity: 1 - Math.abs(diff) * 0.4,
    zIndex: 10 - Math.abs(diff)
  };
};

// --- 🚀 MOTOR FÍSICO 2.5D INFINITO (HORIZONTAL) ---
const navDragState = { isDragging: false, startX: 0 };
const NAV_DRAG_THRESHOLD = 40;

const selectCategory = (targetIdx) => {
  const N = categories.length;
  const currentActive = ((navIndex.value % N) + N) % N;
  let diff = (targetIdx - currentActive) % N;
  
  if (diff > N / 2) diff -= N;
  if (diff < -N / 2) diff += N;
  
  navIndex.value += diff;
  playTick(); 
  playHapticTick();
};

const startNavDrag = (e) => {
  navDragState.isDragging = true;
  navDragState.startX = e.touches ? e.touches[0].clientX : e.clientX;
};

const onNavDrag = (e) => {
  if (!navDragState.isDragging) return;
  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const diff = navDragState.startX - currentX;
  if (Math.abs(diff) > NAV_DRAG_THRESHOLD) {
    navIndex.value += Math.sign(diff); 
    playTick(); 
    playHapticTick();
    navDragState.startX = currentX; 
  }
};
const stopNavDrag = () => { navDragState.isDragging = false; };
const handleNavWheel = (e) => { 
  navIndex.value += e.deltaY > 0 ? 1 : -1; 
  playTick(); 
  playHapticTick(); 
};

const getHorizontalRollerStyle = (idx) => {
  const N = categories.length;
  const activeIdx = ((navIndex.value % N) + N) % N;
  let diff = (idx - activeIdx) % N;
  
  if (diff > N / 2) diff -= N;
  if (diff < -N / 2) diff += N;

  if (Math.abs(diff) > 2) return { opacity: 0, pointerEvents: 'none' };
  
  return {
    transform: `translate(-50%, -50%) translateX(${diff * 80}px) rotateY(${diff * 25}deg) scale(${1 - Math.abs(diff) * 0.15})`,
    opacity: 1 - Math.abs(diff) * 0.3,
    zIndex: 10 - Math.abs(diff)
  };
};
</script>

<template>
  <div class="master-container">
    <main class="app-canvas">
      
      <header class="header-standard shrink-0 relative flex justify-between items-center py-2 sm:py-3 px-4 sm:px-6 shadow-sm z-30">
        
        <div class="w-8 h-8 sm:w-10 sm:h-10 invisible hidden md:block"></div>

        <div class="flex items-center justify-center md:justify-center gap-2 sm:gap-3 flex-1 md:flex-none">
            <div class="css-atom scale-75 sm:scale-90 transform origin-center shrink-0">
               <div class="css-atom-nucleus"></div>
               <div class="css-atom-orbit orbit-1"></div>
               <div class="css-atom-orbit orbit-2"></div>
            </div>
            <span class="text-[#312e81] font-black text-[15px] sm:text-xl uppercase tracking-widest leading-none font-numbers italic text-shadow-sm mt-0.5 truncate">
              Conversor Cuántico
            </span>
        </div>

        <button @click="emit('close')" class="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white border-2 border-slate-200 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

      </header>

      <div class="game-content flex-1 flex flex-col items-center py-1 w-full overflow-hidden">
        
        <div class="main-visual-area flex-[1.2] flex items-center justify-center w-full min-h-0 relative px-2 pt-1 pb-2">
            
            <div class="app-device w-full max-w-[380px] h-full max-h-[580px] rounded-[2rem] flex flex-col relative overflow-hidden bg-slate-800 border-[5px] border-slate-950 shadow-2xl">
              
              <div class="h-10 bg-gradient-to-b from-indigo-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 border-b border-black shrink-0 shadow-md z-20">
                <span class="text-white font-black text-base drop-shadow-md uppercase tracking-widest">{{ activeCategory.name }}</span>
              </div>

              <div class="h-6 bg-gradient-to-b from-[#eee] to-[#ccc] flex items-center justify-end px-4 border-b border-[#999] shrink-0 z-20 shadow-inner">
                <span class="text-black text-[11px] font-bold">{{ formulaDisplay }}</span>
              </div>

              <div class="h-[85px] sm:h-[95px] flex flex-col shrink-0 border-b-[3px] border-slate-950 z-20 carbon-fiber shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)]">
                <div class="flex-1 flex justify-between items-center px-4 py-1 cursor-pointer relative transition-all" @click="selectBox('top')">
                  <div class="absolute inset-0 transition-colors" :class="activeBox === 'top' ? 'bg-white/10' : 'bg-transparent'"></div>
                  <div class="w-3 h-3 rounded-full border border-black shadow-[0_0_5px_rgba(0,0,0,0.8)] z-10 shrink-0" :class="activeBox === 'top' ? 'led-orange-on' : 'led-orange-off'"></div>
                  <div class="flex items-baseline gap-2 z-10 w-[80%] justify-end overflow-hidden">
                    <span class="text-3xl sm:text-4xl font-bold tracking-tight truncate text-right" :class="activeBox === 'top' ? 'text-[#ffcc00] drop-shadow-[0_0_8px_rgba(255,204,0,0.6)]' : 'text-[#aa8800]'">{{ topDisplayValue }}</span>
                    <span class="text-white text-sm sm:text-base font-bold shrink-0">{{ topUnit.sym }}</span>
                  </div>
                </div>
                
                <div class="flex-1 flex justify-between items-center px-4 py-1 cursor-pointer relative transition-all border-t border-white/5" @click="selectBox('bottom')">
                  <div class="absolute inset-0 transition-colors" :class="activeBox === 'bottom' ? 'bg-white/10' : 'bg-transparent'"></div>
                  <div class="w-3 h-3 rounded-full border border-black shadow-[0_0_5px_rgba(0,0,0,0.8)] z-10 shrink-0" :class="activeBox === 'bottom' ? 'led-green-on' : 'led-green-off'"></div>
                  <div class="flex items-baseline gap-2 z-10 w-[80%] justify-end overflow-hidden">
                    <span class="text-3xl sm:text-4xl font-bold tracking-tight truncate text-right" :class="activeBox === 'bottom' ? 'text-[#aaff00] drop-shadow-[0_0_8px_rgba(170,255,0,0.6)]' : 'text-[#558800]'">{{ bottomDisplayValue }}</span>
                    <span class="text-white text-sm sm:text-base font-bold shrink-0">{{ bottomUnit.sym }}</span>
                  </div>
                </div>
              </div>

              <div class="flex-1 p-2 sm:p-3 grid grid-cols-5 gap-2 bg-gradient-to-b from-[#e0e4e8] to-[#c1c6cb] border-b-2 border-slate-900 z-20 shadow-inner overflow-hidden">
                <button 
                  v-for="(key, idx) in keypad" :key="idx" @click="handleKey(key)"
                  class="h-full min-h-[48px] sm:min-h-[56px] relative rounded-lg border border-[#888] flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-800 metal-btn"
                  :class="{ 'opacity-0 pointer-events-none': key === '' }"
                >
                  <span v-if="key === '⌫'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21 4-14 0-5 8 5 8 14 0c.5 0 1-.5 1-1l0-14c0-.5-.5-1-1-1z"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  </span>
                  <span v-else>{{ key }}</span>
                </button>
              </div>

              <div class="h-[120px] sm:h-[140px] relative w-full flex bg-gradient-to-b from-slate-400 via-slate-100 to-slate-400 z-10 perspective-container shadow-[inset_0_5px_15px_rgba(0,0,0,0.3)]">
                
                <div class="absolute top-1/2 left-0 right-0 h-[35px] -translate-y-1/2 bg-gradient-to-b from-[rgba(255,255,255,0.7)] to-[rgba(255,255,255,0.3)] border-y border-[rgba(0,0,0,0.3)] shadow-[0_2px_4px_rgba(0,0,0,0.1)] pointer-events-none z-20"></div>

                <div class="flex-1 relative h-full overflow-hidden cursor-ns-resize touch-pan-y"
                     @wheel.prevent="handleVerticalWheel($event, 'top')" @mousedown="startVerticalDrag($event, 'top')" @mousemove="onVerticalDrag($event, 'top')" @mouseup="stopVerticalDrag('top')" @mouseleave="stopVerticalDrag('top')" @touchstart.passive="startVerticalDrag($event, 'top')" @touchmove.prevent="onVerticalDrag($event, 'top')" @touchend="stopVerticalDrag('top')">
                  <div class="absolute w-full h-full flex flex-col items-center justify-center">
                    <div v-for="(unit, idx) in currentUnits" :key="'top-'+unit.id" 
                         class="roller-item absolute w-full h-[35px] px-2 flex items-center justify-center transition-all duration-200 antialiased"
                         :style="getVerticalRollerStyle(idx, topIndex)">
                      <span class="truncate w-full text-center" :class="idx === topIndex ? 'text-slate-900 font-black text-[15px] sm:text-[18px] drop-shadow-md z-30' : 'text-slate-600 font-semibold text-sm sm:text-base'">
                        {{ unit.name }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="w-px h-full bg-gradient-to-b from-transparent via-slate-500 to-transparent relative z-30 pointer-events-none"></div>

                <div class="flex-1 relative h-full overflow-hidden cursor-ns-resize touch-pan-y"
                     @wheel.prevent="handleVerticalWheel($event, 'bottom')" @mousedown="startVerticalDrag($event, 'bottom')" @mousemove="onVerticalDrag($event, 'bottom')" @mouseup="stopVerticalDrag('bottom')" @mouseleave="stopVerticalDrag('bottom')" @touchstart.passive="startVerticalDrag($event, 'bottom')" @touchmove.prevent="onVerticalDrag($event, 'bottom')" @touchend="stopVerticalDrag('bottom')">
                  <div class="absolute w-full h-full flex flex-col items-center justify-center">
                    <div v-for="(unit, idx) in currentUnits" :key="'bot-'+unit.id" 
                         class="roller-item absolute w-full h-[35px] px-2 flex items-center justify-center transition-all duration-200 antialiased"
                         :style="getVerticalRollerStyle(idx, bottomIndex)">
                      <span class="truncate w-full text-center" :class="idx === bottomIndex ? 'text-slate-900 font-black text-[15px] sm:text-[18px] drop-shadow-md z-30' : 'text-slate-600 font-semibold text-sm sm:text-base'">
                        {{ unit.name }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="h-[60px] bg-gradient-to-b from-slate-700 to-slate-900 flex justify-center items-center z-20 shrink-0 border-t border-slate-950 relative overflow-hidden perspective-container cursor-ew-resize touch-pan-x"
                   @wheel.prevent="handleNavWheel" @mousedown="startNavDrag" @mousemove="onNavDrag" @mouseup="stopNavDrag" @mouseleave="stopNavDrag" @touchstart.passive="startNavDrag" @touchmove.prevent="onNavDrag" @touchend="stopNavDrag">
                
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85px] h-[50px] bg-black/30 border border-black/50 rounded-xl shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] pointer-events-none z-10"></div>
                
                <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div v-for="(cat, idx) in categories" :key="'nav-'+cat.id" 
                       class="absolute top-1/2 left-1/2 w-[85px] h-[50px] flex flex-col items-center justify-center transition-all duration-300 pointer-events-auto cursor-pointer"
                       :style="getHorizontalRollerStyle(idx)"
                       @click="selectCategory(idx)">
                    <span class="text-[20px] mb-0.5 drop-shadow-xl filter" :class="activeCategoryIndex === idx ? 'scale-110 transition-transform' : 'opacity-70'">{{ cat.icon }}</span>
                    <span class="text-[9px] font-black uppercase tracking-wider transition-colors" :class="activeCategoryIndex === idx ? 'text-white' : 'text-slate-500'">
                      {{ cat.name }}
                    </span>
                  </div>
                </div>
                
                <div class="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-slate-800 to-transparent pointer-events-none z-30"></div>
                <div class="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-slate-800 to-transparent pointer-events-none z-30"></div>
              </div>

            </div>

        </div>

        <div class="rules-panel shrink-0 mx-auto w-full mt-1">
          <div class="rules-badge shadow-md">OPERACIÓN</div>
          <div class="rules-grid text-[13px] font-medium text-slate-600 text-center leading-tight">
              Desliza la rueda de abajo o haz clic en los íconos para cambiar de herramienta.
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

<style scoped>
/* 🛡️ CONTENEDOR MAESTRO (FONDO PANTALLA) */
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

/* 📱 LIENZO DE LA APP (CANVAS) */
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
  overflow-y: auto; 
  overflow-x: hidden;
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
    overflow: hidden; 
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

/* 🏛️ ESTILOS DE COMPONENTES HOMOLOGADOS */
.header-standard {
  width: 100%;
  background: white;
  border-bottom: 2px solid #f1f5f9;
}

.rules-panel {
  width: 92%;
  max-width: 600px; 
  background: white;
  padding: 1.1rem 1rem 0.7rem 1rem;
  border-radius: 1.5rem;
  border: 2px solid #e2e8f0;
  position: relative;
  margin-bottom: 0.3rem;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
}

.rules-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%); 
  background: #4f46e5;
  color: white;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 14px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.app-canvas::-webkit-scrollbar { display: none; }
.app-canvas { -ms-overflow-style: none; scrollbar-width: none; }
.font-numbers { font-family: 'Nunito', sans-serif; font-weight: 800; }
.text-shadow-sm { text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }

/* --- ⚛️ CSS DEL ÁTOMO 2.5D --- */
.css-atom { position: relative; width: 34px; height: 34px; display: flex; justify-content: center; align-items: center; }
.css-atom-nucleus { width: 10px; height: 10px; background-color: #4338ca; border-radius: 50%; box-shadow: 0 0 8px rgba(67,56,202,0.6); z-index: 2;}
.css-atom-orbit { position: absolute; width: 100%; height: 100%; border: 3px solid #6366f1; border-radius: 50%; }
.orbit-1 { transform: rotateX(70deg) rotateY(45deg); animation: orbitSpin1 8s linear infinite; }
.orbit-2 { transform: rotateX(70deg) rotateY(-45deg); animation: orbitSpin2 8s linear infinite; }
@keyframes orbitSpin1 { 100% { transform: rotateX(70deg) rotateY(45deg) rotateZ(360deg); } }
@keyframes orbitSpin2 { 100% { transform: rotateX(70deg) rotateY(-45deg) rotateZ(360deg); } }

/* --- 📟 CSS DEL ARTEFACTO (3D y Texturas Retro) --- */
.antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
.perspective-container { perspective: 800px; }
.transform-style-3d { transform-style: preserve-3d; }

.roller-item { top: 50%; left: 0; transform-origin: center center -60px; will-change: transform, opacity; pointer-events: none; backface-visibility: hidden; }

.carbon-fiber {
  background: 
    radial-gradient(black 15%, transparent 16%) 0 0,
    radial-gradient(black 15%, transparent 16%) 4px 4px,
    radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px,
    radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 4px 5px;
  background-color: #1e293b; background-size: 8px 8px;
}

.led-orange-on { background: radial-gradient(circle at 30% 30%, #ffcc00, #ff6600); box-shadow: 0 0 8px #ff6600; }
.led-orange-off { background: radial-gradient(circle at 30% 30%, #663300, #221100); }
.led-green-on { background: radial-gradient(circle at 30% 30%, #aaff00, #339900); box-shadow: 0 0 8px #339900; }
.led-green-off { background: radial-gradient(circle at 30% 30%, #334400, #112200); }

.metal-btn { background: linear-gradient(to bottom, #fefefe, #d4d8db); box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 3px rgba(0,0,0,0.3); }
.metal-btn:active { background: linear-gradient(to bottom, #d4d8db, #fefefe); box-shadow: inset 0 2px 4px rgba(0,0,0,0.4); transform: translateY(1px); }
</style>